from flask import Blueprint, jsonify
from flask_login import login_required
from app.models import User
from app.models import db


user_routes = Blueprint('users', __name__)


@user_routes.route('/')
@login_required
def users():
    """
    Query for all users and returns them in a list of user dictionaries
    """
    users = User.query.all()
    return {'users': [user.to_dict() for user in users]}


# @user_routes.route('/')
# @login_required
# def user_account_balance():
#     """
#     Query for the current user
#     """

@user_routes.route('/<int:id>')
@login_required
def user(id):
    """
    Query for a user by id and returns that user in a dictionary
    """
    user = User.query.get(id)
    return user.to_dict()


@user_routes.route('/<int:id>/delete')
@login_required
def deleteUser(id):
    """
    Query for a user by id, deletes the user, and returns successful message
    """
    user = User.query.get(id)
    if user:
        db.session.delete(user)  # Delete the user
        db.session.commit()  # Commit the transaction to apply the deletion
        return jsonify({"message": f"Successfully deleted User {id}"})
    else:
        return jsonify({"error": "User not found"}), 404