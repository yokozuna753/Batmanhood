from flask import Blueprint, jsonify
from flask_login import current_user, login_required
from app.models import db, Watchlist

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

