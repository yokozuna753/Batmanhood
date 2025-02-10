from flask import Blueprint, request, jsonify
import requests

search_bar= Blueprint('search_bar', __name__)

# RapidAPI configuration
RAPIDAPI_KEY = 'fa20148ac1mshb38fbb928ee92f9p175497jsna328531f092a'
RAPIDAPI_HOST = 'yahoo-finance15.p.rapidapi.com'
BASE_URL = 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote'


# Search Query
# 1. If no query, then the stocks object should have nothing in it since we're not fetching anything
# 2. If there is a query, only then do a max of 5 tickers show in the results 
@search_bar.route('/api/stocks', methods=['GET'])
def get_stocks():
    # Search query from req (convert to uppercase for consistency)
    query = request.args.get('query', '').upper()
    
    if not query:
        return jsonify({"Stocks": []})  # Return empty list if no query

    headers = {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
    }
    
    params = {
        'ticker': query,  # Querying with ticker symbol
        'type': 'STOCKS'   # Specifying the type of data we're requesting
    }
