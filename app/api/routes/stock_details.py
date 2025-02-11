from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user, login_user
from app.models.stocks_owned import StocksOwned
from app.models.user import User
from app.models.db import db
from app.models.orders import Order
from app.forms.transaction_form import TransactionForm
import yfinance as yf
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

stock_details_routes = Blueprint("stock_details", __name__)


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

    # Find the specific stock
    stock = StocksOwned.query.get(stockId)

    if not stock:
        logger.warning(f"No stock found with ID: {stockId}")
        return jsonify({"message": "Stock couldn't be found"}), 404

    # Verify stock ownership
    if stock.owner_id != current_user.id:
        logger.warning(f"Stock {stockId} does not belong to current user")
        return jsonify({"message": "Unauthorized access to stock"}), 403

    try:
        # Get realtime stock data using yfinance
        ticker = yf.Ticker(stock.ticker)

        # Fetch market data
        try:
            market_data = ticker.info
            if not market_data:
                logger.error(f"No market data found for ticker: {stock.ticker}")
                return jsonify({"message": "Unable to fetch market data"}), 500
        except Exception as data_error:
            logger.error(f"Error fetching market data: {data_error}")
            return jsonify(
                {"message": "Error fetching market data", "error": str(data_error)}
            ), 500

        # Fetch news
        news = ticker.news[:2]

        # Fetch order history for this stock
        order_history = Order.query.filter_by(
            owner_id=current_user.id, ticker=stock.ticker
        ).all()

        # Prepare order history for response
        order_details = [
            {
                "id": order.id,
                "shares": order.shares_purchased,
                "price": order.price_purchased,
                "order_type": order.order_type,
            }
            for order in order_history
        ]

        # Response with comprehensive stock details
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
        # market data retrieval with error handling
        try:
            # Print stock information for debugging
            logger.info(f"Attempting to fetch market data for ticker: {stock.ticker}")

            # Use multiple methods to fetch stock price
            ticker = yf.Ticker(stock.ticker)

            # Try different methods to get current price
            current_price = None

            # Method 1: Using .info
            try:
                market_data = ticker.info
                current_price = market_data.get("regularMarketPrice")
                logger.info(f"Price from .info: {current_price}")
            except Exception as info_error:
                logger.error(f"Error fetching info: {info_error}")

            # Method 2: Using .history if .info fails
            if not current_price:
                try:
                    history = ticker.history(period="1d")
                    current_price = (
                        history["Close"].iloc[-1] if not history.empty else None
                    )
                    logger.info(f"Price from history: {current_price}")
                except Exception as history_error:
                    logger.error(f"Error fetching history: {history_error}")

            # Final check for current price
            if not current_price:
                logger.error(f"Unable to retrieve price for {stock.ticker}")
                return jsonify(
                    {
                        "message": "Unable to fetch market price",
                        "details": f"No price data available for {stock.ticker}",
                    }
                ), 500

        except Exception as data_error:
            logger.error(f"Comprehensive market data error: {data_error}")
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
                    ticker=ticker.ticker,
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
        # Get current market price
        ticker = yf.Ticker(stock.ticker)
        current_price = ticker.info.get("regularMarketPrice")

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

        # Add sell order
        db.session.add(sell_order)

        # Delete the stock position
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
