from flask import Blueprint
from app.models.stocks_owned import StocksOwned
from flask_login import login_required
import json
import http.client


portfolio = Blueprint("portfolio", __name__)
# from app.models import User

# get all of the most popular news to display on the portfolio page
        # USE THE BELOW KEY IN EACH REQUEST
# RAPID API KEY ==>  6651915af7mshd9cda3b8839c5e8p12bdc4jsn69f39d90caa4 

@portfolio.route('/<int:userId>/stocks', methods=['GET','POST'])
# @login_required
def stocks_portfolio(userId):
# get all the investments owned by the current logged in user
        stocks_owned = StocksOwned.query.filter(StocksOwned.owner_id == userId).all()
        stock_dict = dict()
        conn = http.client.HTTPSConnection("yahoo-finance15.p.rapidapi.com")
        headers = {
        'x-rapidapi-key': "0c6bcbaa3cmsh50c5adea77dadf5p10a80bjsnac2bcd90f6c5",
        'x-rapidapi-host': "yahoo-finance15.p.rapidapi.com"
        }
        conn.request("GET", "/api/v1/markets/quote?ticker=AAPL&type=STOCKS", headers=headers)

        res = conn.getresponse()
        data = res.read()
        data = data.decode("utf-8")
        res = json.loads(data)
        # res = res["body"]
        
        # for stock in stocks_owned:
        #         print(stock.ticker)
                # query for the stock at the API
        return res