from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user, login_user
from flask_wtf.csrf import validate_csrf, ValidationError
from app.models.stocks_owned import StocksOwned
from app.models.user import User
from app.models.db import db
from app.models.orders import Order
from app.forms.transaction_form import TransactionForm
import yfinance as yf
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

stock_details_routes = Blueprint("stock_details", __name__)

# Cache setup
market_data_cache = {}
CACHE_DURATION = timedelta(minutes=5)


def get_cached_market_data(ticker_symbol):
    """
    Get market data with caching to prevent rate limiting
    """
    now = datetime.now()
    if ticker_symbol in market_data_cache:
        timestamp, data = market_data_cache[ticker_symbol]
        if now - timestamp < CACHE_DURATION:
            return data

    try:
        ticker = yf.Ticker(ticker_symbol)

        # Create a new session if none exists
        if not hasattr(ticker, "session") or ticker.session is None:
            import requests

            ticker.session = requests.Session()

        # Update headers
        ticker.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            }
        )

        try:
            data = ticker.info
        except Exception as e:
            logger.warning(f"Failed to get ticker info: {e}")
            # Fallback to history
            history = ticker.history(period="1d")
            if not history.empty:
                data = {"regularMarketPrice": history["Close"].iloc[-1]}
            else:
                raise Exception("Unable to fetch market data")

        market_data_cache[ticker_symbol] = (now, data)
        return data

    except Exception as e:
        logger.error(f"Error in get_cached_market_data: {e}")
        raise Exception(f"Failed to fetch market data for {ticker_symbol}: {str(e)}")


def validation_errors_to_error_messages(validation_errors):
    """
    Simple function that turns the WTForms validation errors into a simple list
    """
    errorMessages = []
    for field in validation_errors:
        for error in validation_errors[field]:
            errorMessages.append(f"{field} : {error}")
    return errorMessages


@stock_details_routes.route("/auto-login")
def auto_login():
    """
    Automatically log in the first user in the database for testing purposes
    """
    user = User.query.first()
    if user:
        login_user(user)
        logger.info(f"Auto-logged in as {user.first_name}")
        return jsonify({"message": f"Logged in as {user.first_name}"})
    logger.warning("No users found for auto-login")
    return jsonify({"message": "No users found"}), 404


@stock_details_routes.route("/<int:stockId>", methods=["GET"])
@login_required
def get_stock_details(stockId):
    try:
        stock = StocksOwned.query.get(stockId)
        if not stock or stock.owner_id != current_user.id:
            return jsonify({"message": "Stock not found"}), 404

        try:
            ticker = yf.Ticker(stock.ticker)

            # Get historical data for different time periods
            hist_1d = ticker.history(period="1d", interval="5m")
            hist_1w = ticker.history(period="5d")
            hist_1m = ticker.history(period="1mo")
            hist_1y = ticker.history(period="1y")

            # Format historical data
            def format_historical_data(df, interval="1d"):
                return [
                    {
                        "time": index.strftime("%Y-%m-%d %H:%M:%S")
                        if interval == "5m"
                        else index.strftime("%Y-%m-%d"),
                        "price": float(row["Close"]),
                    }
                    for index, row in df.iterrows()
                ]

            # Get current market data
            market_data = ticker.info
            current_price = market_data.get("regularMarketPrice", 0)
            previous_close = market_data.get(
                "regularMarketPreviousClose", current_price
            )

            # Format news data
            news_data = ticker.news
            formatted_news = []

            if news_data and len(news_data) > 0:
                for idx, item in enumerate(news_data[:5]):
                    title = item.get("title")
                    link = item.get("link")
                    if (
                        title and link
                    ):  # Only include news items with both title and link
                        formatted_news.append(
                            {
                                "id": idx + 1,
                                "link": link,
                                "source": item.get("publisher", "Yahoo Finance"),
                                "title": title,
                            }
                        )

            response = {
                "id": stock.id,
                "ownerId": stock.owner_id,
                "ticker": stock.ticker,
                "shares_owned": stock.shares_owned,
                "total_cost": stock.total_cost,
                "regularMarketPrice": current_price,
                "previousClose": previous_close,
                "dayHigh": market_data.get("dayHigh", 0),
                "dayLow": market_data.get("dayLow", 0),
                "volume": market_data.get("volume", 0),
                "priceHistory": {
                    "1D": format_historical_data(hist_1d, "5m"),
                    "1W": format_historical_data(hist_1w),
                    "1M": format_historical_data(hist_1m),
                    "1Y": format_historical_data(hist_1y),
                },
                "News": formatted_news,
                "OrderHistory": [
                    {
                        "id": order.id,
                        "shares": order.shares_purchased,
                        "price": order.price_purchased,
                        "order_type": order.order_type,
                        "date": order.created_at.isoformat()
                        if hasattr(order, "created_at")
                        else None,
                    }
                    for order in Order.query.filter_by(
                        owner_id=current_user.id, ticker=stock.ticker
                    ).all()
                ],
            }

            return jsonify(response)

        except Exception as e:
            logger.error(f"Error fetching market data: {e}")
            return jsonify(
                {"message": "Error fetching market data", "error": str(e)}
            ), 500

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"message": "Server error", "error": str(e)}), 500


@stock_details_routes.route("/<int:stockId>/trade", methods=["POST"])
@login_required
def trade_stock(stockId):
    """
    Handle both buying and selling stock with market and limit orders
    """
    try:
        # Log incoming request payload
        print("🚀 Incoming Trade Request:", request.json)

        # Try multiple ways to get CSRF token
        csrf_token = (
            request.headers.get("X-CSRF-Token")
            or request.headers.get("CSRF-Token")
            or request.cookies.get("csrf_token")
        )

        # Validate CSRF token
        if not csrf_token:
            logger.warning("CSRF token missing")
            return jsonify({"errors": ["CSRF token is required"]}), 400

        try:
            validate_csrf(csrf_token)
        except ValidationError:
            logger.warning("Invalid CSRF token")
            return jsonify({"errors": ["Invalid CSRF token"]}), 400

        # Create form and validate
        form = TransactionForm()
        form.csrf_token.data = csrf_token

        # Log form data before validation
        print(
            f"➡️ Form Data Received - Shares: {form.shares.data}, Amount: {form.amount.data}, Order Type: {form.order_type.data}"
        )

        # Check for validation errors
        if not form.validate_on_submit():
            print("❌ Validation Errors:", form.errors)
            return {"errors": validation_errors_to_error_messages(form.errors)}, 400

        stock = StocksOwned.query.get(stockId)

        try:
            # Get market data with caching
            try:
                market_data = get_cached_market_data(stock.ticker)
                print(
                    f"🔍 Market Data for {stock.ticker}: {market_data}"
                )  # Debugging log

                # Try multiple price fields to ensure we get a valid price
                current_price = (
                    market_data.get("regularMarketPrice")
                    or market_data.get("currentPrice")
                    or market_data.get("ask")
                    or market_data.get("bid")
                    or market_data.get("previousClose")  # Last fallback option
                )

                if not current_price or current_price <= 0:
                    logger.error(
                        f"❌ Unable to retrieve valid price for {stock.ticker}"
                    )
                    return jsonify(
                        {
                            "message": "Unable to fetch market price",
                            "details": f"No price data available for {stock.ticker}. Market data: {market_data}",
                        }
                    ), 500

            except Exception as data_error:
                logger.error(f"Error fetching market data: {data_error}")
                return jsonify(
                    {"message": "Error fetching market data", "error": str(data_error)}
                ), 500

            # Validate shares and amount based on buy_in type
            if form.buy_in.data == "Shares":
                if form.shares.data is None or form.shares.data < 1:
                    return jsonify(
                        {"errors": ["Shares must be atleast 1 if buying in Shares."]}
                    ), 400
                shares_to_trade = int(form.shares.data)
            else:  # If buying in dollars, calculate shars dynamically
                amount_to_use = form.amount.data if form.amount.data is not None else 0
                shares_to_trade = (
                    amount_to_use / current_price if current_price > 0 else 0
                )

            # Convert `shares_to_trade` and `amount_to_use` to valid numbers
            try:
                shares_to_trade = int(shares_to_trade)
                amount_to_use = float(amount_to_use)
            except ValueError:
                return jsonify(
                    {"message": "Invalid numeric values for shares or amount"}
                ), 400

            # Calculate shares if buying in dollars
            if form.buy_in.data == "Dollars":
                shares_to_trade = (
                    amount_to_use / current_price if current_price > 0 else 0
                )

            # Ensure shares to trade is a valid number
            if shares_to_trade <= 0:
                return jsonify({"message": "Invalid trade amount"}), 400

            # Calculate total transaction value
            transaction_value = shares_to_trade * current_price

            # Determine order type
            valid_order_types = ["Market Order", "Limit Order"]
            if form.order_type.data not in valid_order_types:
                return jsonify({"message": "Invalid order type"}), 400

            order_type = form.order_type.data  # Assign order type correctly

            # Debug log
            print(f"✅ Detected Order Type: {order_type}")  # 🚀 Debugging

            # Create a new order record
            new_order = Order(
                owner_id=current_user.id,
                ticker=stock.ticker,
                price_purchased=current_price,
                shares_purchased=shares_to_trade,
                order_type=order_type,
            )

            # Buying logic
            if order_type == "Market Order":
                if transaction_value > current_user.account_balance:
                    logger.warning("Insufficient funds for transaction")
                    return jsonify({"message": "Insufficient funds"}), 400

                # Create new position if doesn't exist
                if not stock:
                    stock = StocksOwned(
                        owner_id=current_user.id,
                        ticker=stock.ticker,
                        shares_owned=0,
                        total_cost=0,
                    )
                    db.session.add(stock)

                # Calculate new average cost
                total_existing_cost = stock.total_cost
                total_new_cost = total_existing_cost + transaction_value
                total_new_shares = stock.shares_owned + shares_to_trade

                # Update stock details
                stock.total_cost = total_new_cost
                stock.shares_owned += shares_to_trade
                current_user.account_balance -= transaction_value

            # Selling logic
            elif order_type == "Limit Order":
                if shares_to_trade > stock.shares_owned:
                    logger.warning("Cannot sell more shares than owned")
                    return jsonify(
                        {"message": "Cannot sell more shares than owned"}
                    ), 400

                # Update stock details
                current_user.account_balance += transaction_value
                stock.shares_owned -= shares_to_trade

                # Recalculate average cost if shares remain
                if stock.shares_owned > 0:
                    stock.total_cost *= stock.shares_owned / (
                        stock.shares_owned + shares_to_trade
                    )
                else:
                    stock.total_cost = 0
                    db.session.delete(stock)

            # Add the new order to the session
            db.session.add(new_order)
            db.session.commit()

            logger.info(f"Transaction successful: {shares_to_trade} shares traded")
            return jsonify(
                {
                    "message": "Transaction successful",
                    "shares_traded": shares_to_trade,
                    "price": current_price,
                    "total_value": transaction_value,
                    "new_average_cost": stock.total_cost,
                }
            )

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing transaction: {e}")
            return jsonify(
                {"message": "Error processing transaction", "error": str(e)}
            ), 500

    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error in trade_stock: {e}")
        return jsonify({"message": "Unexpected error", "error": str(e)}), 500


@stock_details_routes.route("/<int:stockId>", methods=["DELETE"])
@login_required
def sell_all_shares(stockId):
    """
    Sell entire position at market price
    """
    stock = StocksOwned.query.get(stockId)
    if not stock or stock.owner_id != current_user.id:
        logger.warning(f"Stock not found or not owned: {stockId}")
        return jsonify({"message": "Stock couldn't be found"}), 404

    try:
        # Get market data with caching
        try:
            market_data = get_cached_market_data(stock.ticker)
            current_price = market_data.get("regularMarketPrice")
        except Exception as data_error:
            logger.error(f"Error fetching market data: {data_error}")
            return jsonify(
                {"message": "Error fetching market data", "error": str(data_error)}
            ), 500

        # Calculate sale proceeds
        sale_proceeds = stock.shares_owned * current_price

        # Create a sell order record
        sell_order = Order(
            owner_id=current_user.id,
            ticker=stock.ticker,
            price_purchased=current_price,
            shares_purchased=stock.shares_owned,
            order_type="Sell Order",
        )

        # Update user balance and delete position
        current_user.account_balance += sale_proceeds

        # Add sell order and delete stock position
        db.session.add(sell_order)
        db.session.delete(stock)
        db.session.commit()

        logger.info(f"Successfully sold all shares of {stock.ticker}")
        return jsonify(
            {"message": "Successfully sold all shares", "proceeds": sale_proceeds}
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error processing sale: {e}")
        return jsonify({"message": "Error processing sale", "error": str(e)}), 500
