from flask import Blueprint, jsonify
from app.models.user import User
from flask_login import login_required
import yfinance as yf


portfolio = Blueprint("portfolio", __name__)
# from app.models import User

# get all of the most popular news to display on the portfolio page
# USE THE BELOW KEY IN EACH REQUEST
# RAPID API KEY ==>  6651915af7mshd9cda3b8839c5e8p12bdc4jsn69f39d90caa4

"""
SHOW THE USERS PORTFOLIO

- grab all of the stocks they own from the user table 
        - should have the stocks_owned relationship
{'AAPL': {'id': 1, 'estimated_cost': 22740.0, 'owner_id': 1, 'ticker': 'AAPL', 'shares_owned': 100.0, 'stock_info': {'symbol': 'AAPL:NASDAQ', 
'name': 'Apple Inc', 'type': 'stock', 'price': 228.61, 'open': 229.57, 'high': 230.585, 'low': 228.6301, 
'volume': 10927280, 'previous_close': 227.38, 'change': 1.23, 'change_percent': 0.5409, 'pre_or_post_market': 229.51, 
'pre_or_post_market_change': 0.7846, 'pre_or_post_market_change_percent': 0.343, 'last_update_utc': '2025-02-10 17:09:06'}}}

grab the shares_owned & price_purchased from the orders table - relationship with user

"""


@portfolio.route("/<int:userId>/stocks", methods=["GET", "POST"])
@login_required
def stocks_portfolio(userId):
    try:
        # get all the investments owned by the current logged in user => news = [{},{}]
        final_news = []
        user = User.query.filter(User.id == int(userId)).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user_stocks = user.to_dict()["stocks_owned"]

        stock_dict = {"tickers": [], "portfolio_value": 0}
        # ** for loop to show each stock the user owns
        for ticker in user_stocks:
            try:
                # * grab the symbol of the stock from ticker
                symbol = ticker["ticker"]  # * ==> 'AAPL'

                # #* set the portfolio value from the stocks_owned table
                stock_dict["portfolio_value"] += int(ticker["total_cost"])

                # #* set the data for the stock (data, percent gain)
                dat = yf.Ticker(f"{symbol}")
                
                # Add error handling for history fetching
                try:
                    history = dat.history(period="1mo")
                    ticker["historical_data"] = [float(row[0]) for index, row in history.iterrows()]
                except Exception as e:
                    ticker["historical_data"] = []
                    print(f"Error fetching history for {symbol}: {str(e)}")

                # Handle missing data with safer access
                dat_info = dat.info
                if "companyOfficers" in dat_info:
                    del dat_info["companyOfficers"]
                
                ticker["stock_info"] = dat_info

                # Safer calculation for percent gain
                total_cost = ticker.get("total_cost", 0)
                shares = ticker.get("shares_owned", 0)
                
                if shares > 0:
                    avg_cost = total_cost / shares
                    current_price = ticker["stock_info"].get("currentPrice", 0)
                    
                    if avg_cost > 0:
                        percent_gain = ((current_price - avg_cost) / avg_cost) * 100
                        ticker["percent_gain/loss"] = round(percent_gain, 2)
                    else:
                        ticker["percent_gain/loss"] = 0
                else:
                    ticker["percent_gain/loss"] = 0

                # Add error handling for news fetching
                try:
                    news = yf.Search(f"{symbol}", news_count=3).news
                    final_news.append(news)
                except Exception as e:
                    print(f"Error fetching news for {symbol}: {str(e)}")

                # i need to append the ticker object to the stock_dict at the end
                stock_dict["tickers"].append(ticker)
                
            except Exception as e:
                print(f"Error processing ticker {ticker}: {str(e)}")
                continue
                
        # flatten out the news matrix as one array of objects
        try:
            final_news = [x for subarr in final_news for x in subarr]
            stock_dict["news"] = final_news
        except Exception as e:
            stock_dict["news"] = []
            print(f"Error processing news: {str(e)}")

        return jsonify(stock_dict)
        
    except Exception as e:
        print(f"Error in stocks_portfolio: {str(e)}")
        return jsonify({"error": str(e)}), 500


# @portfolio.route('/<int:userId>/stocks/news', methods=['GET'])
# @login_required
# def news_portfolio(userId):
#         user = User.query.filter(User.id == int(2)).all()
#         user_stocks = user[0].to_dict()["stocks_owned"]
#         print('                USER STOCKS !!!! ==>    ',       user_stocks)
#         final_news = {}

#         for stock in user_stocks:
#                 ticker = stock["ticker"]
#                 print('TICKER ====>>>', ticker)


#         return final_news
