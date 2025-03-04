import { useState } from "react";
import { useModal } from "../../context/Modal";
//import "./WatchlistModals.css";

function EditWatchlistModal({ watchlist, onSuccess }) {
    const [name, setName] = useState(watchlist.name);
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
            
            const response = await fetch(`/api/watchlists/${watchlist.id}`, {
                method: "PUT",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrf_token || ""
                },
                body: JSON.stringify({ name })
            });
            
            if (!response.ok) {
                const data = await response.json();
                setErrors(data.errors || { name: "Failed to update watchlist" });
                return;
            }
            
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error updating watchlist:", error);
            setErrors({ name: "An unexpected error occurred" });
        }
    };
    
    return (
        <div className="watchlist-modal">
            <h2>Edit Watchlist</h2>
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
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditWatchlistModal;