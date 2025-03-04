// import { useEffect, useState } from "react";
// import "./WatchlistComponent.css";

// const WatchlistComponent = () => {
//     const [watchlists, setWatchlists] = useState([]);
//     const [expandedWatchlist, setExpandedWatchlist] = useState(null);

//     const getCsrfToken = () => {
//         return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
//       };

//     useEffect(() => {
//         const fetchWatchlists = async () => {
//             try {
//                 const response = await fetch("/api/watchlists/");
//                 if (!response.ok) {
//                     throw new Error("Failed to fetch watchlists");
//                 }
//                 const data = await response.json();
//                 setWatchlists(data);
//             } catch (error) {
//                 console.error("Error fetching watchlists:", error);
//             }
//         };

//         fetchWatchlists();
//     }, []);


//     const toggleWatchlist = (id) => {
//         setExpandedWatchlist(expandedWatchlist === id ? null : id);
//     };

//     const deleteStock = async (watchlistId, symbol) => {
//         try {
//             const csrf_token = getCsrfToken();
//             console.log(watchlistId, symbol);
            
//             const response = await fetch(`/api/watchlists/${watchlistId}/stocks/${symbol}`, {
//                 method: "DELETE",

//                 headers: {'X-CSRF-Token': csrf_token || '',
//                 'Content-Type': 'application/json',}
//             });

//             if (!response.ok) {
//                 throw new Error("Failed to delete stock from watchlist");
//             }

//             // Update state to remove the stock from the watchlist
//             setWatchlists((prevWatchlists) =>
//                 prevWatchlists.map((watchlist) =>
//                     watchlist.id === watchlistId
//                         ? { ...watchlist, stocks: watchlist.stocks.filter((stock) => stock.symbol !== symbol) }
//                         : watchlist
//                 )
//             );
//         } catch (error) {
//             console.error("Error deleting stock:", error);
//         }
//     };

//     return (
//         <div className="watchlist-container">
//             <h2 className="watchlist-container-header">WatchLists</h2>
//             <hr />
//             <ul className="watchlist">
//                 {watchlists.map((watchlist) => (
//                     <li 
//                         className={`list-title ${expandedWatchlist === watchlist.id ? 'expanded' : ''}`} 
//                         key={watchlist.id}
//                     >
//                         <div onClick={() => toggleWatchlist(watchlist.id)}>
//                             {watchlist.name}
//                         </div>
//                         <ul>
//                             {watchlist.stocks.length > 0 ? (
//                                 watchlist.stocks.map((stock) => (
//                                     <li key={stock.symbol}>
//                                         {stock.symbol}
//                                         <button
//                                             onClick={(e) => {
//                                                 e.stopPropagation();
//                                                 deleteStock(watchlist.id, stock.symbol);
//                                             }}
//                                         >
//                                             ×
//                                         </button>
//                                     </li>
//                                 ))
//                             ) : (
//                                 <li>No stocks in this watchlist</li>
//                             )}
//                         </ul>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }

// export default WatchlistComponent;


import { useState, useEffect } from "react";
import { FaChevronDown, FaChevronRight, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useModal } from "../../context/Modal";
import AddWatchlistModal from "../AddWatchlistModal";
import EditWatchlistModal from "../EditWatchlistModal";
import AddStockModal from "../AddStockModal";
import "./WatchlistComponent.css";

const WatchlistComponent = () => {
    const [watchlists, setWatchlists] = useState([]);
    const [expandedWatchlist, setExpandedWatchlist] = useState(null);
    const { setModalContent, closeModal } = useModal();

    const getCsrfToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
    };

    useEffect(() => {
        fetchWatchlists();
    }, []);

    const fetchWatchlists = async () => {
        try {
            const response = await fetch("/api/watchlists/", {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to fetch watchlists");
            }
            
            const data = await response.json();
            setWatchlists(data);
        } catch (error) {
            console.error("Error fetching watchlists:", error);
        }
    };

    const toggleWatchlist = (id) => {
        setExpandedWatchlist(expandedWatchlist === id ? null : id);
    };

    const deleteStock = async (watchlistId, symbol, e) => {
        e.stopPropagation(); // Add this to prevent event bubbling
        try {
            const csrf_token = getCsrfToken();
            
            const response = await fetch(`/api/watchlists/${watchlistId}/stocks/${symbol}`, {
                method: "DELETE",
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': csrf_token || '',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to delete stock from watchlist");
            }
            
            // Update state to remove the stock from the watchlist
            setWatchlists((prevWatchlists) =>
                prevWatchlists.map((watchlist) =>
                    watchlist.id === watchlistId
                        ? { ...watchlist, stocks: watchlist.stocks.filter((stock) => stock.symbol !== symbol) }
                        : watchlist
                )
            );
        } catch (error) {
            console.error("Error deleting stock:", error);
        }
    };

    const deleteWatchlist = async (watchlistId, e) => {
        e.stopPropagation(); // Prevent event bubbling
        try {
            const csrf_token = getCsrfToken();
            
            const response = await fetch(`/api/watchlists/${watchlistId}`, {
                method: "DELETE",
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': csrf_token || '',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to delete watchlist");
            }
            
            // Update state to remove the watchlist
            setWatchlists(watchlists.filter(watchlist => watchlist.id !== watchlistId));
            
            // If the deleted watchlist was expanded, collapse it
            if (expandedWatchlist === watchlistId) {
                setExpandedWatchlist(null);
            }
        } catch (error) {
            console.error("Error deleting watchlist:", error);
        }
    };

    const openAddWatchlistModal = () => {
        setModalContent(
            <AddWatchlistModal 
                onSuccess={() => {
                    fetchWatchlists();
                    closeModal();
                }}
            />
        );
    };

    const openEditWatchlistModal = (watchlist, e) => {
        e.stopPropagation(); // Prevent event bubbling
        setModalContent(
            <EditWatchlistModal 
                watchlist={watchlist}
                onSuccess={() => {
                    fetchWatchlists();
                    closeModal();
                }}
            />
        );
    };

    const openAddStockModal = (watchlistId, e) => {
        e.stopPropagation(); // Prevent event bubbling
        setModalContent(
            <AddStockModal 
                watchlistId={watchlistId}
                onSuccess={() => {
                    fetchWatchlists();
                    closeModal();
                }}
            />
        );
    };

    return (
        <div className="watchlist-container">
            <div className="watchlist-header">
                <h2>Watchlists</h2>
                <button 
                    className="add-watchlist-button"
                    onClick={openAddWatchlistModal}
                >
                    <FaPlus /> Add List
                </button>
            </div>
            <hr />
            <ul className="watchlist">
                {watchlists.length === 0 ? (
                    <li className="no-watchlists">No watchlists yet. Create one to get started!</li>
                ) : (
                    watchlists.map((watchlist) => (
                        <li 
                            className={`list-title ${expandedWatchlist === watchlist.id ? 'expanded' : ''}`} 
                            key={watchlist.id}
                        >
                            <div className="watchlist-item-header" onClick={() => toggleWatchlist(watchlist.id)}>
                                <div className="watchlist-name">
                                    {expandedWatchlist === watchlist.id ? <FaChevronDown /> : <FaChevronRight />}
                                    {watchlist.name}
                                </div>
                                <div className="watchlist-actions">
                                    <button 
                                        className="edit-button"
                                        onClick={(e) => openEditWatchlistModal(watchlist, e)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button 
                                        className="delete-button"
                                        onClick={(e) => deleteWatchlist(watchlist.id, e)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            {expandedWatchlist === watchlist.id && (
                                <ul className="stocks-list">
                                    {watchlist.stocks.length > 0 ? (
                                        watchlist.stocks.map((stock) => (
                                            <li key={stock.symbol} className="stock-item">
                                                <span className="stock-symbol">{stock.symbol}</span>
                                                <button
                                                    className="delete-stock-button"
                                                    onClick={(e) => deleteStock(watchlist.id, stock.symbol, e)}
                                                >
                                                    ×
                                                </button>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="no-stocks">No stocks in this watchlist</li>
                                    )}
                                    <li className="add-stock-item">
                                        <button 
                                            className="add-stock-button"
                                            onClick={(e) => openAddStockModal(watchlist.id, e)}
                                        >
                                            <FaPlus /> Add Stock
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default WatchlistComponent;