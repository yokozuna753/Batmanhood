import { useState, useRef, useEffect } from 'react';
import '../SearchBar/SearchBar.css'

/* Watchlist Search Bar adopts but modifies the origional Search Bar
   design and implementation.
   
   Adoptations: Search bar component design and search yFinance route

   Modifications: Adds debounce tactic to limit api calls as user types,
                  Accepts onStockSelect callback which procces selected stock through the backend
*/

// Will be nested in the AddStockModal component
const WatchlistSearchBar = ({ onStockSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const searchRef = useRef(null);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
          setResults([]);
          setError('');
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
  
    const handleSearch = async () => {
      console.log("***** INSIDE SEARCH! *****")
      if (!query) {
        setError('Please enter a query');
        return;
      }
  
      try {
        const response = await fetch(`/api/search?query=${query}&max_results=5`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setResults(data);
        setError('');
      } catch (err) {
        setError('Failed to fetch results');
        setResults([]);
      }
    };
  
    const handleInputChange = (e) => {
      setQuery(e.target.value);
      if (e.target.value.length >= 2) {
        handleSearch();
      }
    };
  
    return (
      <div className="search-wrapper" ref={searchRef}>
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search"
            className="search-input"
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {results.length > 0 && (
          <div className="search-results-container">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => onStockSelect(result)} // Call the callback instead of navigating
                className="search-result-item"
              >
                <div>
                  <span className="stock-symbol">{result.symbol}</span>
                  <span className="stock-name"> • {result.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

export default WatchlistSearchBar;