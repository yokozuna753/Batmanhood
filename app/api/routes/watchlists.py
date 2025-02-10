from flask import Blueprint, jsonify
from flask_login import current_user, login_required
from app.models import db, Watchlist, WatchlistStock

watchlists = Blueprint("watchlists", __name__)

# GET all watchlists
@watchlists.route('/', methods=['GET'])
@login_required
def get_user_watchlists():
    watchlists = Watchlist.query.filter(user_id = current_user.id).all()
    return jsonify([watchlist.to_dict() for watchlist in watchlists])

# DELETE a watchlist
@watchlists.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_watchlist(id):
    watchlist = Watchlist.query.filter_by(id=id, user_id=current_user.id).first()
    if not watchlist:
        return jsonify({"error": "Watchlist not found"}), 404

    db.session.delete(watchlist)
    db.session.commit()
    return jsonify({"message": "Watchlist dropped successfully"})

# GET all stocks in a watchlist
@watchlists.route('/<int:watchlist_id>/stocks', methods=['GET'])
@login_required
def get_stocks_in_watchlist(watchlist_id):
    watchlist_stocks = WatchlistStock.query.filter_by(watchlist_id=watchlist_id).all()
    stock_ids = [ws.stock_id for ws in watchlist_stocks]

    stock_data = [fetch_stock_data_from_api(symbol) for symbol in stock_ids]
    
    return jsonify(stock_data)
