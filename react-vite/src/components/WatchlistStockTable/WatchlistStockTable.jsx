import { useEffect, useState } from "react";

const WatchlistStockTable = ({ watchedStocks }) => {
    console.log("*****INSIDE WATCHLIST STOCK TABLE!*****");

    const [stockData, setStockData] = useState([]);

    useEffect(() => {
        const fetchStockData = async () => {
            try {
                const stockPromises = watchedStocks.map(async (symbol) => {
                    const response = await fetch(
                        `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote?ticker=${symbol}&type=STOCKS`,
                        {
                            headers: {
                                "x-rapidapi-host": "yahoo-finance15.p.rapidapi.com",
                                "x-rapidapi-key": process.env.REACT_APP_RAPIDAPI_KEY
                            }
                        }
                    );
                    const data = await response.json();
                    console.log("Value of fetched data response: ", data)
                    return data[0];
                });


                const stocks = await Promise.all(stockPromises);
                setStockData(stocks);
            } catch (error) {
                console.error("Error fetching stock data:", error);
            }
        };

        fetchStockData();
    }, [watchedStocks]);

    return (
        <table>
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Market Price</th>
                    <th>Change %</th>
                    <th>Market Cap</th>
                </tr>
            </thead>
            <tbody>
                {stockData.map((stock) => (
                    <tr key={stock.symbol}>
                        <td>{stock.symbol}</td>
                        <td>${stock.regularMarketPrice.toFixed(2)}</td>
                        <td style={{ color: stock.regularMarketChangePercent >= 0 ? "green" : "red" }}>
                            {stock.regularMarketChangePercent.toFixed(2)}%
                        </td>
                        <td>${(stock.marketCap / 1e9).toFixed(1)}B</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default WatchlistStockTable;
