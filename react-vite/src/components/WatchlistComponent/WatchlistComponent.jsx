import { useEffect, useState } from "react";


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

    return (
        <div>
            <h2>Your Watchlists</h2>
            <ul>
                {watchlists.map((watchlist) => (
                    <li key={watchlist.id}>
                        {/* Clickable Watchlist Name */}
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
        </div>
    );
}

export default WatchlistComponent;