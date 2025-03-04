import logging
import yfinance as yf
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from app.models import db, Watchlist, WatchlistStock

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

watchlists = Blueprint("watchlists", __name__)


# 1. GET all session user watchlists
@watchlists.route('/', methods=['GET'])
@login_required
def get_user_watchlists():  
    logger.info("Fetching watchlists for user with ID: %d", current_user.id)

    watchlists = Watchlist.query.filter_by(user_id=current_user.id).all()

    watchlist_data = []
    for watchlist in watchlists:
        watchlist_stocks = WatchlistStock.query.filter_by(watchlist_id=watchlist.id).all()
        stock_symbols = [ws.symbol for ws in watchlist_stocks]

        watchlist_data.append({
            "id": watchlist.id,
            "name": watchlist.name,
            "stocks": [{"symbol": symbol} for symbol in stock_symbols]
        })

    return jsonify(watchlist_data), 200




# 2. DELETE a session user's watchlist
@watchlists.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_watchlist(id):
    logger.info("Attempting to delete watchlist with ID: %d for user with ID: %d", id, current_user.id)
    watchlist = Watchlist.query.filter_by(id=id, user_id=current_user.id).first()
    
    if not watchlist:
        logger.error("Watchlist with ID %d not found for user with ID: %d", id, current_user.id)
        return jsonify({"error": "Watchlist not found"}), 404

    db.session.delete(watchlist)
    db.session.commit()
    logger.info("Successfully deleted watchlist with ID: %d", id)
    return jsonify({"message": "Watchlist dropped successfully"}), 200






@watchlists.route('/stocks/<string:symbol>', methods=['POST'])
@login_required
def add_stock_to_watchlists(symbol):
    logger.info("Attempting to add stock %s to user's watchlists", symbol)
    data = request.json
    watchlist_ids = data.get('watchlist_ids', [])

    if not isinstance(watchlist_ids, list):
        logger.error("Invalid data format for watchlist_ids. Expected a list, received: %s", type(watchlist_ids))
        return jsonify({"error": "Invalid data format, expected a list"}), 400

    for watchlist_id in watchlist_ids:
        existing_entry = WatchlistStock.query.filter_by(
            watchlist_id=watchlist_id, symbol=symbol
        ).first()

        if not existing_entry:
            new_entry = WatchlistStock(watchlist_id=watchlist_id, symbol=symbol)
            db.session.add(new_entry)
            logger.info("Added stock %s to watchlist with ID: %d", symbol, watchlist_id)

    db.session.commit()
    logger.info("Successfully added stock %s to selected watchlists", symbol)
    return jsonify({"message": "Stock added to watchlists successfully"}), 200


# 5. DELETE stock from a session user's watchlist(s)
@watchlists.route("/stocks/<string:symbol>", methods=["DELETE"])
@login_required
def remove_stock_from_watchlists(symbol):
    logger.info("Attempting to remove stock %s from user's watchlists", symbol)
    data = request.json
    watchlist_ids = data.get("watchlist_ids", [])

    if not isinstance(watchlist_ids, list):
        logger.error("Invalid data format for watchlist_ids. Expected a list, received: %s", type(watchlist_ids))
        return jsonify({"error": "Invalid watchlist_ids format, expected a list"}), 400

    if not watchlist_ids:
        logger.info("No watchlist IDs provided for stock %s removal, nothing to remove", symbol)
        return jsonify({"message": "No watchlist IDs provided, nothing to remove"}), 200

    WatchlistStock.query.filter(
        WatchlistStock.watchlist_id.in_(watchlist_ids),
        WatchlistStock.symbol == symbol
    ).delete(synchronize_session=False)
    
    db.session.commit()
    logger.info("Successfully removed stock %s from selected watchlists", symbol)
    return jsonify({"message": "Stock removed from watchlists successfully"}), 200




# 6. GET all session user watchlists that contain a specific stock symbol
@watchlists.route('/stocks/<string:symbol>', methods=['GET'])
@login_required
def get_watchlists_with_stock(symbol):
    logger.info("Fetching watchlists containing stock %s", symbol)
    watchlist_stocks = WatchlistStock.query.filter_by(symbol=symbol).all()
    watchlist_ids = [ws.watchlist_id for ws in watchlist_stocks]
    target_watchlists = Watchlist.query.filter(
        Watchlist.id.in_(watchlist_ids),
        Watchlist.user_id == current_user.id
    ).all()

    logger.info("Found %d watchlists containing stock %s", len(target_watchlists), symbol)
    return jsonify([watchlist.to_dict() for watchlist in target_watchlists]), 200


@watchlists.route('/<int:watchlistId>/stocks/<string:symbol>', methods=['DELETE'])
@login_required
def delete_stock_from_watchlist(watchlistId, symbol):
    watchlist_stock = WatchlistStock.query.filter_by(watchlist_id=watchlistId, symbol=symbol).first()
    
    if not watchlist_stock:
        return jsonify({"error": "Stock not found in watchlist"}), 404
    
    db.session.delete(watchlist_stock)
    db.session.commit()
    
    return jsonify({"message": "Stock removed from watchlist successfully"}), 200

