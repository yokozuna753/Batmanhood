from flask import Blueprint, jsonify
from flask_login import current_user, login_required
from app.models import Watchlist

watchlists = Blueprint("watchlists", __name__)

# GET session user's watchlists
@watchlists.route('/', methods=['GET'])
@login_required
def get_user_watchlists():
    watchlists = Watchlist.query.filter(user_id = current_user.id).all()
    return jsonify([watchlist.to_dict() for watchlist in watchlists])



