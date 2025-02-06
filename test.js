/*
@app.route('/api/stocks')
def stocks():
    stocks_returned = fetch('/get_all_stocks')

    ^^^
    returns {
    stock1: ......
    stock2:......
    }

    ...
    ......
    .........
    ..........
    return res.status(200).json(stocks_returned)



    PORTFOLIO directory batmanhood/backend/api/routes/stocks

    1. fetching the data for the stocks that the user owns.
        - query the stocks owned table
        - grab the stocks that the user owns
            -fetch from the RH api for the data with
            set interval
        -  send to the frontend the returned data

    2. fetching the data for the stocks that the user has
        on their watch list.
        - query the stocks table for stocks the user is 
            watching
            - grab those stocks
            -fetch from the RH api for the data with
            set interval
        -  send to the frontend the returned data


*/