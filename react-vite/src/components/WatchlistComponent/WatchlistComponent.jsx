import { useEffect, useState } from "react";


const WatchlistComponent = () => {
    const [watchlists, setWatchlists] = useState([]);

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

    return (
        <div>
            <h1>Session Users Watchlist</h1>
            <ul>
                {watchlists.map((watchlist) => (
                    <li key={watchlist.id}>
                        <strong>{watchlist.name}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default WatchlistComponent;