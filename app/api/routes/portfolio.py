from flask import Blueprint, jsonify
from app.models.user import User
from flask_login import login_required
import yfinance as yf



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
@login_required
def stocks_portfolio(userId):
# get all the investments owned by the current logged in user
        
        user = User.query.filter(User.id == int(userId)).all() 
        user_stocks = user[0].to_dict()["stocks_owned"]

        stock_dict = {"portfolio_value": 0}
# ** for loop to show each stock the user owns 
        for ticker in user_stocks:
                #* grab the symbol of the stock from ticker
                symbol = ticker["ticker"]


                # #* set the stock dictionary keys to the symbols and values to the data returned
                stock_dict[symbol] = ticker

                # #* set the portfolio value from the stocks_owned table
                stock_dict["portfolio_value"] += int(ticker["total_cost"])

                # #* set the data for the stock (data, percent gain)
                dat = yf.Ticker(f'{symbol}')
                dat = dat.info
                del dat['companyOfficers']
                print('             DATA HERE         ==>', dat)

                # del dat['']

                stock_dict[symbol]["stock_info"] = dat

                total_cost = stock_dict[symbol]['total_cost']
                shares = stock_dict[symbol]['shares_owned']
                avg_cost = total_cost / shares
                percent_gain = ((stock_dict[symbol]['stock_info']['currentPrice'] - avg_cost) / avg_cost) * 100
                stock_dict[symbol]['percent_gain/loss'] = round(percent_gain,2)
                # print(stock_dict)

        return jsonify(stock_dict)


@portfolio.route('/<int:userId>/stocks/news', methods=['GET'])
@login_required
def news_portfolio(userId):
        user = User.query.filter(User.id == int(2)).all() 
        user_stocks = user[0].to_dict()["stocks_owned"]
        print('                USER STOCKS !!!! ==>    ',       user_stocks)
        final_news = {}

        for stock in user_stocks:
                ticker = stock["ticker"]
                print('TICKER ====>>>', ticker)
                news = yf.Search(f'{ticker}', news_count=3).news
                final_news[ticker] = news
        
        return final_news