import { useEffect, useState } from "react";
import "./WatchlistComponent.css";

const WatchlistComponent = () => {
    const [watchlists, setWatchlists] = useState([]);
    const [expandedWatchlist, setExpandedWatchlist] = useState(null);

    useEffect(() => {
        const fetchWatchlists = async () => {
            try {
                const response = await fetch("/api/watchlists/");
                if (!response.ok) {
                    throw new Error("Failed to fetch watchlists");
                }
                const data = await response.json();
                setWatchlists(data);
            } catch (error) {
                console.error("Error fetching watchlists:", error);
            }
        };

        fetchWatchlists();
    }, []);


    const toggleWatchlist = (id) => {
        setExpandedWatchlist(expandedWatchlist === id ? null : id);
    };

    const deleteStock = async (watchlistId, stockSymbol) => {
        try {
            const response = await fetch(`/api/watchlists/${watchlistId}/stocks/${stockSymbol}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete stock from watchlist");
            }

            // Update state to remove the stock from the watchlist
            setWatchlists((prevWatchlists) =>
                prevWatchlists.map((watchlist) =>
                    watchlist.id === watchlistId
                        ? { ...watchlist, stocks: watchlist.stocks.filter((stock) => stock.symbol !== stockSymbol) }
                        : watchlist
                )
            );
        } catch (error) {
            console.error("Error deleting stock:", error);
        }
    };

    return (
        <div className="watchlist-container">
            <h2 className="watchlist-container-header ">Lists</h2>
            <hr />
            <ul className="watchlist">
                {watchlists.map((watchlist) => (
                    <li className="list-title" key={watchlist.id}>

                        <div onClick={() => toggleWatchlist(watchlist.id)} style={{ cursor: "pointer", fontWeight: "bold" }}>
                            {watchlist.name}
                        </div>

                        {/* Show Stocks if Watchlist is Expanded */}
                        {expandedWatchlist === watchlist.id && (
                            <ul style={{ marginLeft: "20px", marginTop: "5px" }}>
                                {watchlist.stocks.length > 0 ? (
                                    watchlist.stocks.map((stock) => (
                                        <li key={stock.symbol}>
                                            {stock.symbol}
                                            <button
                                                onClick={() => deleteStock(watchlist.id, stock.symbol)}
                                                style={{ marginLeft: "10px", cursor: "pointer", color: "red" }}
                                            >
                                                ❌
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li>No stocks in this watchlist</li>
                                )}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div >
    );
}

export default WatchlistComponent;