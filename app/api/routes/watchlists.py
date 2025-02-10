from flask import Blueprint, jsonify
from flask_login import current_user, login_required
from app.models import db, Watchlist, WatchlistStock

# Fetch stock details by id utility function
# def fetch_stock_data(symbol):
#     url = f"https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote?ticker={symbol}&type=STOCKS"

#     headers = {
#         "x-rapidapi-host": "yahoo-finance15.p.rapidapi.com",
#         "x-rapidapi-key": <get api key>
#     }

#     response = requests.get(url, headers=headers)

#     if response.status_code == 200:
#         stock_data = response.json()
#         if stock_data and isinstance(stock_data, list):  # Ensure data is a list
#             return stock_data[0]  # Return first stock object
#         return None
#     else:
#         print(f"Error fetching stock data: {response.status_code}, {response.text}")
#         return None

watchlists = Blueprint("watchlists", __name__)

# GET all session user's watchlists
@watchlists.route('/', methods=['GET'])
@login_required
def get_user_watchlists():
    watchlists = Watchlist.query.filter_by(user_id = current_user.id).all()
    return jsonify([watchlist.to_dict() for watchlist in watchlists])

# DELETE a session user's watchlist
@watchlists.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_watchlist(id):
    watchlist = Watchlist.query.filter_by(id=id, user_id=current_user.id).first()
    if not watchlist:
        return jsonify({"error": "Watchlist not found"}), 404

    db.session.delete(watchlist)
    db.session.commit()
    return jsonify({"message": "Watchlist dropped successfully"})

# GET all stocks in a session user's watchlist
@watchlists.route('/<int:watchlist_id>/stocks', methods=['GET'])
@login_required
def get_stocks_in_watchlist(watchlist_id):
    watchlist_stocks = WatchlistStock.query.filter_by(watchlist_id=watchlist_id).all()
    stock_ids = [ws.stock_id for ws in watchlist_stocks]

    stock_data = [fetch_stock_data(symbol) for symbol in stock_ids]
    
    return jsonify(stock_data)

# GET all session user's watchlists that contain a specific stock symbol
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

    return jsonify([watchlist.to_dict() for watchlist in target_watchlists])
