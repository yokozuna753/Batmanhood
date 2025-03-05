import { useState } from "react";
import { useModal } from "../../context/Modal";
import "./WatchlistModals.css";

function AddWatchlistModal({ onSuccess }) {
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({});
    const { closeModal } = useModal();
    
    const getCsrfToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setErrors({ name: "Watchlist name is required" });
            return;
        }
        
        try {
            const csrf_token = getCsrfToken();
            
            const response = await fetch("/api/watchlists/", {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrf_token || ""
                },
                body: JSON.stringify({ name })
            });
            
            if (!response.ok) {
                const data = await response.json();
                setErrors(data.errors || { name: "Failed to create watchlist" });
                return;
            }
            
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error creating watchlist:", error);
            setErrors({ name: "An unexpected error occurred" });
        }
    };
    
    return (
        <div className="watchlist-modal">
            <h2>Create Watchlist</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="watchlist-name">Watchlist Name</label>
                    <input
                        id="watchlist-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter watchlist name"
                    />
                    {errors.name && <p className="error">{errors.name}</p>}
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={closeModal} className="cancel-button">
                        Cancel
                    </button>
                    <button type="submit" className="submit-button">
                        Create Watchlist
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddWatchlistModal;