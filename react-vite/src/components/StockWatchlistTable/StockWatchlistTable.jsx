// import { useEffect, useState } from "react";

const WatchlistStockTable = ({ stockData }) => {
    console.log("*****INSIDE WATCHLIST STOCK TABLE!*****");

    return (
        <table>
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Price</th>
                    <th>today</th>
                    <th>Market Cap</th>
                </tr>
            </thead>
            <tbody>
                {stockData.map((stock) => (
                    <tr key={stock.symbol}>
                        <td>{stock.symbol}</td>
                        <td>${stock.regularMarketPrice.toFixed(2)}</td>
                        <td>{stock.regularMarketChangePercent.toFixed(2)}%</td>
                        <td>${(stock.marketCap)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default WatchlistStockTable;

