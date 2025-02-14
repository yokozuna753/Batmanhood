import yfinance as yf
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from app.models import db, Watchlist, WatchlistStock


watchlists = Blueprint("watchlists", __name__)


# Utility function to fetch watchlisted stock data
def fetch_stock_data(symbols):

    stocks = yf.Tickers(" ".join(symbols))
    stock_data = []

    for symbol in symbols:
        stock = stocks.tickers.get(symbol)
        if stock:
            stock_data.append({
                "symbol": symbol,
                "marketPrice": stock.info.get("regularMarketPrice"),
                "changePercent": stock.info.get("regularMarketChangePercent"),
                "marketCap": stock.info.get("marketCap")
            })

    return stock_data


#1 GET all session user watchlists
@watchlists.route('/', methods=['GET'])
@login_required
def get_user_watchlists():
    watchlists = Watchlist.query.filter_by(user_id = current_user.id).all()
    return jsonify([watchlist.to_dict() for watchlist in watchlists]), 200


#2 DELETE a session user's watchlist
@watchlists.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_watchlist(id):
    print(f"*****INSIDE DELETE WATCHLIST ROUTE!*****")
    watchlist = Watchlist.query.filter_by(id=id, user_id=current_user.id).first()
    print(f"Pending watchlist for deletion: {watchlist}")
    if not watchlist:
        return jsonify({"error": "Watchlist not found"}), 404

    db.session.delete(watchlist)
    db.session.commit()
    return jsonify({"message": "Watchlist dropped successfully"}), 200


#3 GET all stocks in a session user's watchlist
@watchlists.route('/<int:watchlist_id>/stocks', methods=['GET'])
@login_required
def get_stocks_in_watchlist(watchlist_id):
    watchlist_stocks = WatchlistStock.query.filter_by(watchlist_id=watchlist_id).all()
    stock_symbols = [ws.symbol for ws in watchlist_stocks]

    if not stock_symbols:
        return jsonify([]), 200

    stock_data = fetch_stock_data(stock_symbols)
    return jsonify(stock_data), 200


#4 POST stock to a session user's watchlist(s)
## request data-> { "watchlist_ids": [1, 3, 4] }
## response data-> {"message": "Stock added to watchlists successfully"}
@watchlists.route('/stocks/<string:symbol>', methods=['POST'])
@login_required
def add_stock_to_watchlists(symbol):
    data = request.json
    watchlist_ids = data.get('watchlist_ids', []) # Default to empty list if not provided

    # Ensure watchlist_ids is a list
    if not isinstance(watchlist_ids, list):
        return jsonify({"error": "Invalid data format, expected a list"}), 400

    # Add stock to selected watchlist(s)
    for watchlist_id in watchlist_ids:
        existing_entry = WatchlistStock.query.filter_by(
            watchlist_id=watchlist_id, symbol=symbol
        ).first()

        if not existing_entry:
            new_entry = WatchlistStock(watchlist_id=watchlist_id, symbol=symbol)
            db.session.add(new_entry)

    db.session.commit()
    return jsonify({"message": "Stock added to watchlists successfully"}), 200


#5 DELETE stock from a session user's watchlist(s)
## request data-> { "watchlist_ids": [1, 3, 4] }
## response data-> {"message": "Stock added to watchlists successfully"}
@watchlists.route("/stocks/<string:symbol>", methods=["DELETE"])
@login_required
def remove_stock_from_watchlists(symbol):
    data = request.json
    watchlist_ids = data.get("watchlist_ids", []) # Default to empty list of not provided

    # Ensure watchlist_ids is a list to prevent NoneType errors. Can't filter 'in' an object of NO type
    if not isinstance(watchlist_ids, list):
        return jsonify({"error": "Invalid watchlist_ids format, expected a list"}), 400
    
    # Return early if not watchlist_ids selected for deletion
    if not watchlist_ids: 
        return jsonify({"message": "No watchlist IDs provided, nothing to remove"}), 200

    # Remove stock from (de)selected watchlist(s)
    WatchlistStock.query.filter(
        WatchlistStock.watchlist_id.in_(watchlist_ids),
        WatchlistStock.symbol == symbol
    ).delete(synchronize_session=False)
    # sync session false waits on the next query to reflect changes instead of updating
    # at/around execution time for each delete, which should occur once a dependent
    # component rerenders due to a slice of state change

    db.session.commit()
    return jsonify({"message": "Stock removed from watchlists successfully"}), 200


# GET all session user watchlists that contain a specific stock symbol
# Returns a list of the session user's watchlist that contain the targeted symbol
@watchlists.route('/stocks/<string:symbol>', methods=['GET'])
@login_required
def get_watchlists_with_stock(symbol):
    # Find all WatchlistStock entries containing a symbol matching the parameter value
    watchlist_stocks = WatchlistStock.query.filter_by(symbol=symbol).all()

    # Save the watchlist IDs of WatchlistStock entries containing the matching parameter
    watchlist_ids = [ws.watchlist_id for ws in watchlist_stocks]

    # Select the watchlists objects containing the matching symbol
    target_watchlists = Watchlist.query.filter(
        Watchlist.id.in_(watchlist_ids),
        Watchlist.user_id == current_user.id
    ).all()

    return jsonify([watchlist.to_dict() for watchlist in target_watchlists]), 200