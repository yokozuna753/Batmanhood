import { useState } from "react";
import { useModal } from "../../context/Modal";
import WatchlistSearchBar from "./WatchlistSearchBar";
import "./WatchlistModals.css";

function AddStockModal({ watchlistId, onSuccess }) {
    const [selectedStock, setSelectedStock] = useState(null);
    const [errors, setErrors] = useState({});
    const { closeModal } = useModal();

    const getCsrfToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedStock) {
            setErrors({ stock: "Please select a stock from the search results" });
            return;
        }
        
        try {
            const csrf_token = getCsrfToken();
            
            const response = await fetch(`/api/watchlists/stocks/${selectedStock.symbol}`, {
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
            closeModal();
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
                    <WatchlistSearchBar onStockSelect={(stock) => setSelectedStock(stock)} /> {/* Pass callback */}
                    {selectedStock && (
                        <p>Selected Stock: <strong>{selectedStock.symbol}</strong> - {selectedStock.name}</p>
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
                        disabled={!selectedStock}
                    >
                        Add Stock
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddStockModal;
