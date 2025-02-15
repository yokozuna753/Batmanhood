import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


const WatchlistPage = () => {

    console.log("*****HIT WATCHLIST PAGE!*****")

    const {watchlist_id} = useParams()
    const [watchlist, setWatchlist] = useState(null);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWatchlistData = async () => {
      try {
        // Get target Watchlist
        const watchlistRes = await fetch(`/api/watchlists/${watchlist_id}`);
        if (!watchlistRes.ok) throw new Error("Failed to fetch watchlist");
        const watchlistData = await watchlistRes.json();
        setWatchlist(watchlistData);

        // Get stocks in target watchlist
        const stocksRes = await fetch(`/api/watchlists/${watchlist_id}/stocks`);
        if (!stocksRes.ok) throw new Error("Failed to fetch stocks");
        const stocksData = await stocksRes.json();
        setStocks(stocksData);

      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        fetchWatchlistData();
    }, [watchlist_id]);

    if (loading) return <p>Loading watchlist...</p>;
    if (!watchlist) return <p>Watchlist not found.</p>;

  return (
    <div>
      <h1>{watchlist.name}</h1>
      <StockWatchlistTable stocks={stocks} />
    </div>
  );
  
}

export default WatchlistPage;