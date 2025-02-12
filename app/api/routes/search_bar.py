from flask import Blueprint, request, jsonify
import yfinance as yf
from yfinance import Search

search_bar = Blueprint('search_bar', __name__)

# Search Query
# 1. If no query, then the stocks object should have nothing in it since we're not fetching anything
# 2. If there is a query, only then do a max of 5 tickers show in the results 
# Replace with your actual API key

@search_bar.route('/search', methods=['GET'])
def search():
    query = request.args.get('query')  # Get the search query from the request
    max_results = int(request.args.get('max_results', 5))  # Default to 5 results, but can be modified for more

    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        # Searching yfinance
        search_results = Search(query, max_results=max_results)
        
        # Grab the relevant data, and append this information into the results array
        results = []
        for quote in search_results.quotes:
            results.append({
                'symbol': quote['symbol'],
                'name': quote['shortname']
            })

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500