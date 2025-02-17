import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StockWatchlistTable from '../StockWatchlistTable';

const WatchlistPage = () => {

  console.log("*****HIT WATCHLIST PAGE!*****")

  const { watchlist_id } = useParams()
  console.log("Value of watchlist id: ", watchlist_id);
  const [watchlist, setWatchlist] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchWatchlistData = async () => {
      try {
        // Get target Watchlist
        const watchlistRes = await fetch(`/api/watchlists/${watchlist_id}`);
        console.log("Value of watchlist response: ", watchlistRes)
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