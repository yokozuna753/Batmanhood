from flask import Blueprint
from app.models.stocks_owned import StocksOwned
from app.models.user import User
from flask_login import login_required
import json
import http.client


portfolio = Blueprint("portfolio", __name__)
# from app.models import User

# get all of the most popular news to display on the portfolio page
        # USE THE BELOW KEY IN EACH REQUEST
# RAPID API KEY ==>  6651915af7mshd9cda3b8839c5e8p12bdc4jsn69f39d90caa4 

'''
SHOW THE USERS PORTFOLIO

- grab all of the stocks they own from the user table 
        - should have the stocks_owned relationship
{'AAPL': {'id': 1, 'estimated_cost': 22740.0, 'owner_id': 1, 'ticker': 'AAPL', 'shares_owned': 100.0, 'stock_info': {'symbol': 'AAPL:NASDAQ', 
'name': 'Apple Inc', 'type': 'stock', 'price': 228.61, 'open': 229.57, 'high': 230.585, 'low': 228.6301, 
'volume': 10927280, 'previous_close': 227.38, 'change': 1.23, 'change_percent': 0.5409, 'pre_or_post_market': 229.51, 
'pre_or_post_market_change': 0.7846, 'pre_or_post_market_change_percent': 0.343, 'last_update_utc': '2025-02-10 17:09:06'}}}

grab the shares_owned & price_purchased from the orders table - relationship with user

'''

@portfolio.route('/<int:userId>/stocks', methods=['GET','POST'])
# @login_required
def stocks_portfolio(userId):
# get all the investments owned by the current logged in user
        user = User.query.filter(User.id == 1).all()
        user_stocks = user[0].to_dict()["stocks_owned"]
        stock_dict = {"portfolio_value": 0}
        conn = http.client.HTTPSConnection("yahoo-finance15.p.rapidapi.com")
        headers = {
        'x-rapidapi-key': "0c6bcbaa3cmsh50c5adea77dadf5p10a80bjsnac2bcd90f6c5",
        'x-rapidapi-host': "real-time-finance-data.p.rapidapi.com"
        }
        # !! for loop to show each stock the user owns 
        for ticker in user_stocks:
                # grab the symbol of the stock from ticker
                symbol = ticker.to_dict()["ticker"]

                # request the stock info from API dynamically and convert to JSON
                conn.request("GET", f"/stock-quote?symbol={symbol}%3ANASDAQ&language=en", headers=headers)
                res = conn.getresponse()
                data = res.read()
                data = data.decode("utf-8")
                res = json.loads(data)

                # set the stock dictionary keys to the symbols and values to the data returned
                stock_dict[symbol] = ticker.to_dict()
                stock_dict["portfolio_value"] += int(ticker.to_dict()["total_cost"])
                # i want the total portfolio value for all of the stocks
                        # grab the shares - $200
                stock_dict[symbol]["stock_info"] = res["data"]
        
        # grab the orders info from the user table

        #! for loop to get the percent gain for each stock and add it to the stock_dict
        for order in user[0].orders:
                total_cost = 0
                total_shares = 0
                order = order.to_dict()
                # add total shares up for each order
                num_shares = float(order["shares_purchased"])
                total_shares += num_shares
                # add total cost for each order
                price = float(order["price_purchased"])
                total_cost += price * num_shares
                print(total_cost)
        
        avg_price = total_cost / total_shares
        print(avg_price)

        return stock_dict