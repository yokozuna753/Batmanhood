from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user, login_user
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

    ticker = yf.Ticker(ticker_symbol)
    ticker.session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
    )

    try:
        data = ticker.info
    except Exception:
        # Fallback to history
        history = ticker.history(period="1d")
        if not history.empty:
            data = {"regularMarketPrice": history["Close"].iloc[-1]}
        else:
            raise Exception("Unable to fetch market data")

    market_data_cache[ticker_symbol] = (now, data)
    return data


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
    """
    Get details of a stock by its ID with error handling
    """
    logger.info(f"Attempting to fetch stock details for stockId: {stockId}")
    logger.info(f"Current User ID: {current_user.id}")

    stock = StocksOwned.query.get(stockId)
    if not stock:
        logger.warning(f"No stock found with ID: {stockId}")
        return jsonify({"message": "Stock couldn't be found"}), 404

    if stock.owner_id != current_user.id:
        logger.warning(f"Stock {stockId} does not belong to current user")
        return jsonify({"message": "Unauthorized access to stock"}), 403

    try:
        # Get market data with caching and fallback
        try:
            market_data = get_cached_market_data(stock.ticker)
        except Exception as data_error:
            logger.error(f"Error fetching market data: {data_error}")
            return jsonify(
                {"message": "Error fetching market data", "error": str(data_error)}
            ), 500

        # Create ticker for news
        ticker = yf.Ticker(stock.ticker)
        ticker.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            }
        )

        # Fetch news with error handling
        news = []
        try:
            news = ticker.news[:2]
        except Exception as news_error:
            logger.warning(f"Error fetching news: {news_error}")

        # Fetch order history
        order_history = Order.query.filter_by(
            owner_id=current_user.id, ticker=stock.ticker
        ).all()

        order_details = [
            {
                "id": order.id,
                "shares": order.shares_purchased,
                "price": order.price_purchased,
                "order_type": order.order_type,
            }
            for order in order_history
        ]

        response = {
            "id": stock.id,
            "ownerId": stock.owner_id,
            "ticker": stock.ticker,
            "shares_owned": stock.shares_owned,
            "estimated_cost": stock.estimated_cost,
            "regularMarketPrice": market_data.get("regularMarketPrice"),
            "News": [
                {
                    "id": idx + 1,
                    "link": item.get("link"),
                    "source": "Yahoo Finance",
                    "title": item.get("title"),
                }
                for idx, item in enumerate(news)
            ],
            "OrderHistory": order_details,
        }

        logger.info(f"Successfully retrieved stock details for {stock.ticker}")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Unexpected error in get_stock_details: {e}")
        return jsonify(
            {"message": "Unexpected error fetching stock data", "error": str(e)}
        ), 500


@stock_details_routes.route("/<int:stockId>/trade", methods=["POST"])
@login_required
def trade_stock(stockId):
    """
    Handle both buying and selling stock with market and limit orders
    """
    form = TransactionForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if not form.validate_on_submit():
        logger.warning(f"Validation errors in trade_stock: {form.errors}")
        return {"errors": validation_errors_to_error_messages(form.errors)}, 400

    stock = StocksOwned.query.get(stockId)

    try:
        # Get market data with caching
        try:
            market_data = get_cached_market_data(stock.ticker)
            current_price = market_data.get("regularMarketPrice")

            if not current_price:
                logger.error(f"Unable to retrieve price for {stock.ticker}")
                return jsonify(
                    {
                        "message": "Unable to fetch market price",
                        "details": f"No price data available for {stock.ticker}",
                    }
                ), 500

        except Exception as data_error:
            logger.error(f"Error fetching market data: {data_error}")
            return jsonify(
                {"message": "Error fetching market data", "error": str(data_error)}
            ), 500

        # Calculate shares based on dollars if needed
        shares_to_trade = form.shares.data
        if form.buy_in.data == "Dollars":
            shares_to_trade = form.amount.data / current_price

        # Calculate total transaction value
        transaction_value = shares_to_trade * current_price

        # Determine order type
        order_type = (
            "Buy Order" if form.order_type.data == "Buy Order" else "Sell Order"
        )

        # Create a new order record
        new_order = Order(
            owner_id=current_user.id,
            ticker=stock.ticker,
            price_purchased=current_price,
            shares_purchased=shares_to_trade,
            order_type=order_type,
        )

        # Buying logic
        if order_type == "Buy Order":
            if transaction_value > current_user.account_balance:
                logger.warning("Insufficient funds for transaction")
                return jsonify({"message": "Insufficient funds"}), 400

            # Create new position if doesn't exist
            if not stock:
                stock = StocksOwned(
                    owner_id=current_user.id,
                    ticker=stock.ticker,
                    shares_owned=0,
                    estimated_cost=0,
                )
                db.session.add(stock)

            # Calculate new average cost
            total_existing_cost = stock.estimated_cost * stock.shares_owned
            total_new_cost = total_existing_cost + transaction_value
            total_new_shares = stock.shares_owned + shares_to_trade

            # Update stock details
            stock.estimated_cost = total_new_cost / total_new_shares
            stock.shares_owned += shares_to_trade
            current_user.account_balance -= transaction_value

        # Selling logic
        else:
            if shares_to_trade > stock.shares_owned:
                logger.warning("Cannot sell more shares than owned")
                return jsonify({"message": "Cannot sell more shares than owned"}), 400

            # Update stock details
            current_user.account_balance += transaction_value
            stock.shares_owned -= shares_to_trade

            # Recalculate average cost if shares remain
            if stock.shares_owned > 0:
                stock.estimated_cost *= stock.shares_owned / (
                    stock.shares_owned + shares_to_trade
                )
            else:
                stock.estimated_cost = 0
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
                "new_average_cost": stock.estimated_cost,
            }
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error processing transaction: {e}")
        return jsonify(
            {"message": "Error processing transaction", "error": str(e)}
        ), 500


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
