from flask import Blueprint, request, jsonify

search_bar= Blueprint('search_bar', __name__)

# Search Query
# 1. If no query, then the stocks object should have nothing in it since we're not fetching anything
# 2. If there is a query, only then do a max of 5 tickers show in the results 
# Replace with your actual API key

@search_bar.route('/search', methods=['GET'])
def search_stock():
    query = request.args.get('symbol')
    
    if not query:
        return jsonify({'stocks': []}), 200  # No query, return empty results
    
    conn = http.client.HTTPSConnection(real-time-finance-data.p.rapidapi.com)

    headers = {
        'x-rapidapi-key': "fa20148ac1mshb38fbb928ee92f9p175497jsna328531f092a",
        'x-rapidapi-host': "real-time-finance-data.p.rapidapi.com"
    }
    conn.request("GET", f"/search?query={query}&language=en", headers=headers)

    res = conn.getresponse()

    data = res.read()
    response_data = json.loads(data.decode("utf-8"))
    
    # Extract stock info (symbol and name) from the 'stock' field
    stocks = response_data.get('data', {}).get('stock', [])
    
    # Sort alphabetically and limit to the first 5 results
    stocks_sorted = sorted(stocks, key=lambda x: x['symbol'])[:5]
    
    # Return only the symbol and name
    results = [{
        'symbol': stock.get('symbol'),
        'name': stock.get('name')
    } for stock in stocks_sorted]
    
    return jsonify({'stocks': results}), 200