from flask import Blueprint, jsonify, request
from flask_cors import CORS
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


CORS(
    stock_details_routes,
    resources={
        r"/*": {
            "origins": ["http://localhost:5174"],
            "methods": ["GET", "POST", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Content-Type",
                "X-CSRF-Token",
                "XSRF-TOKEN",
                "X-Request-ID",
            ],
            "supports_credentials": True,
            "expose_headers": [
                "Content-Type",
                "X-CSRF-Token",
                "XSRF-TOKEN",
                "X-Request-ID",
            ],
        }
    },
)

# Cache setup
market_data_cache = {}
CACHE_DURATION = timedelta(minutes=5)
processed_requests = set()


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

        # Try multiple methods to get the price
        try:
            # Method 1: Try getting from info
            data = ticker.info
            if "regularMarketPrice" not in data:
                raise Exception("No regular market price in info")

        except Exception as e1:
            try:
                # Method 2: Try getting from history
                history = ticker.history(period="1d")
                if not history.empty:
                    data = {"regularMarketPrice": float(history["Close"].iloc[-1])}
                else:
                    raise Exception("Empty history data")

            except Exception as e2:
                try:
                    # Method 3: Try getting from fast_info
                    data = {"regularMarketPrice": float(ticker.fast_info["lastPrice"])}
                except Exception as e3:
                    logger.error(f"All price fetch methods failed: {e1}, {e2}, {e3}")
                    raise Exception("Unable to fetch market data through any method")

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

        # Get market data with caching
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

            # Get current market data with retry
            retries = 3
            market_data = None
            for attempt in range(retries):
                try:
                    market_data = get_cached_market_data(stock.ticker)
                    if market_data and "regularMarketPrice" in market_data:
                        break
                except Exception as e:
                    if attempt == retries - 1:
                        raise Exception(
                            f"Failed to get market data after {retries} attempts"
                        )
                    continue

            if not market_data:
                raise Exception("Failed to fetch market data")

            current_price = market_data.get("regularMarketPrice", 0)
            previous_close = market_data.get(
                "regularMarketPreviousClose", current_price
            )

            response = {
                "id": stock.id,
                "ownerId": stock.owner_id,
                "ticker": stock.ticker,
                "shares_owned": stock.shares_owned,
                "estimated_cost": stock.total_cost,
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
                "News": [
                    {
                        "id": idx + 1,
                        "link": item.get("link"),
                        "source": "Yahoo Finance",
                        "title": item.get("title"),
                    }
                    for idx, item in enumerate(ticker.news[:5])
                ],
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
    request_id = request.headers.get("X-Request-ID")
    try:
        # Check for duplicate request
        if request_id:
            if request_id in processed_requests:
                logger.info(f"Duplicate request detected: {request_id}")
                return jsonify({"message": "Request already processed"}), 409
            processed_requests.add(request_id)

        data = request.get_json()
        if not data:
            logger.error("No data provided in request")
            return jsonify({"errors": ["No data provided"]}), 400

        # Get the stock
        stock = StocksOwned.query.get(stockId)
        if not stock:
            logger.error(f"Stock not found with ID: {stockId}")
            return jsonify({"errors": ["Stock not found"]}), 404

        # Input validation
        if "order_type" not in data:
            return jsonify({"message": "Order type is required"}), 400
        if "buy_in" not in data:
            return jsonify({"message": "Buy in type is required"}), 400
        if data["buy_in"] == "Dollars" and not data.get("amount"):
            return jsonify(
                {"message": "Amount is required for dollar-based trades"}
            ), 400
        if data["buy_in"] == "Shares" and not data.get("shares"):
            return jsonify(
                {"message": "Number of shares is required for share-based trades"}
            ), 400

        # Get market data with retry
        retries = 3
        current_price = None
        for attempt in range(retries):
            try:
                market_data = get_cached_market_data(stock.ticker)
                current_price = market_data.get("regularMarketPrice")
                if current_price:
                    break
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt == retries - 1:
                    logger.error(f"Failed to get market data after {retries} attempts")
                    return jsonify(
                        {
                            "message": "Unable to fetch market price",
                            "details": f"Price data unavailable for {stock.ticker} after multiple attempts",
                        }
                    ), 500
                continue

        if not current_price:
            return jsonify({"message": "Unable to fetch current price"}), 500

        try:
            # Calculate shares based on dollars if needed
            shares_to_trade = data.get("shares", 0)
            if data.get("buy_in") == "Dollars":
                amount = float(data.get("amount", 0))
                shares_to_trade = amount / current_price
            else:
                shares_to_trade = float(shares_to_trade or 0)

            # Validate the calculated shares
            if shares_to_trade <= 0:
                return jsonify({"message": "Invalid number of shares"}), 400

            # Calculate total transaction value
            transaction_value = shares_to_trade * current_price
        except (ValueError, TypeError) as e:
            logger.error(f"Error calculating trade values: {e}")
            return jsonify({"message": "Invalid trade values"}), 400

        # Determine if it's a buy or sell based on order type
        is_buy = data.get("order_type") == "Market Order"

        # Create a new order record
        new_order = Order(
            owner_id=current_user.id,
            ticker=stock.ticker,
            price_purchased=current_price,
            shares_purchased=shares_to_trade,
            order_type="Buy Order" if is_buy else "Sell Order",
        )

        try:
            # Buying logic
            if is_buy:
                if transaction_value > current_user.account_balance:
                    return jsonify({"message": "Insufficient funds"}), 400

                # Calculate new average cost
                total_existing_cost = stock.total_cost * stock.shares_owned
                total_new_cost = total_existing_cost + transaction_value
                total_new_shares = stock.shares_owned + shares_to_trade

                # Update stock details
                stock.total_cost = total_new_cost
                stock.shares_owned += shares_to_trade
                current_user.account_balance -= transaction_value

            # Selling logic
            else:
                if shares_to_trade > stock.shares_owned:
                    return jsonify(
                        {"message": "Cannot sell more shares than owned"}
                    ), 400

                # Update stock details
                current_user.account_balance += transaction_value
                stock.shares_owned -= shares_to_trade

                # Recalculate total cost if shares remain
                if stock.shares_owned > 0:
                    stock.total_cost = (stock.total_cost * stock.shares_owned) / (
                        stock.shares_owned + shares_to_trade
                    )
                else:
                    stock.total_cost = 0

            # Add the new order to the session
            db.session.add(new_order)
            db.session.commit()

            return jsonify(
                {
                    "message": "Transaction successful",
                    "shares_traded": shares_to_trade,
                    "price": current_price,
                    "total_value": transaction_value,
                    "new_total_cost": stock.total_cost,
                }
            )

        except Exception as db_error:
            db.session.rollback()
            logger.error(f"Database error during trade: {db_error}")
            if request_id:
                processed_requests.remove(request_id)
            return jsonify({"message": "Database error during trade"}), 500

    except Exception as e:
        if request_id:
            processed_requests.remove(request_id)
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
        # Get market data with retry
        retries = 3
        current_price = None
        for attempt in range(retries):
            try:
                market_data = get_cached_market_data(stock.ticker)
                current_price = market_data.get("regularMarketPrice")
                if current_price:
                    break
            except Exception as e:
                if attempt == retries - 1:
                    logger.error(f"Failed to get market data after {retries} attempts")
                    return jsonify(
                        {
                            "message": "Unable to fetch market price",
                            "details": f"Price data unavailable for {stock.ticker} after multiple attempts",
                        }
                    ), 500
                continue

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
