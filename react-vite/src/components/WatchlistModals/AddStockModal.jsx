import { useState, useEffect } from "react";
import { useModal } from "../../context/Modal";
import "./WatchlistModals.css";

function AddStockModal({ watchlistId, onSuccess }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSearching, setIsSearching] = useState(false);
    const { closeModal } = useModal();
    
    const getCsrfToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
    };

    useEffect(() => {
        // Debounce search to avoid excessive API calls
        const timeoutId = setTimeout(() => {
            if (query.length >= 2) {
                searchStocks();
            } else {
                setResults([]);
            }
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [query]);

    const searchStocks = async () => {
        setIsSearching(true);
        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&max_results=5`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to search stocks");
            }
            
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Error searching stocks:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectStock = (stock) => {
        setSelected(stock);
        setQuery(stock.symbol);
        setResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selected) {
            setErrors({ stock: "Please select a stock from the search results" });
            return;
        }
        
        try {
            const csrf_token = getCsrfToken();
            
            const response = await fetch(`/api/watchlists/stocks/${selected.symbol}`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrf_token || ""
                },
                body: JSON.stringify({ watchlist_ids: [watchlistId] })
            });
            
            if (!response.ok) {
                const data = await response.json();
                setErrors(data.errors || { stock: "Failed to add stock to watchlist" });
                return;
            }
            
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error adding stock to watchlist:", error);
            setErrors({ stock: "An unexpected error occurred" });
        }
    };
    
    return (
        <div className="watchlist-modal">
            <h2>Add Stock to Watchlist</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="stock-search">Search for a stock</label>
                    <input
                        id="stock-search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter stock symbol or name"
                        autoComplete="off"
                    />
                    {isSearching && <p className="searching">Searching...</p>}
                    {results.length > 0 && !selected && (
                        <ul className="search-results">
                            {results.map((stock) => (
                                <li 
                                    key={stock.symbol} 
                                    onClick={() => handleSelectStock(stock)}
                                >
                                    <strong>{stock.symbol}</strong> - {stock.name}
                                </li>
                            ))}
                        </ul>
                    )}
                    {errors.stock && <p className="error">{errors.stock}</p>}
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={closeModal} className="cancel-button">
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={!selected}
                    >
                        Add Stock
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddStockModal;