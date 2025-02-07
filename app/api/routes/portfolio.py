from flask import Blueprint

portfolio = Blueprint("portfolio", __name__)
# from app.models import User

# get all of the most popular news to display on the portfolio page
        # USE THE BELOW KEY IN EACH REQUEST
# RAPID API KEY ==>  6651915af7mshd9cda3b8839c5e8p12bdc4jsn69f39d90caa4 

@portfolio.route('/api/<int:userId>/stocks')
def portfolio_route(methods=['GET','POST']):
# get all the investments owned by the current logged in user
    pass