import { useState, useRef, useEffect } from 'react';
import '../SearchBar/SearchBar.css'

/* Watchlist Search Bar adopts but modifies the original Search Bar
   design and implementation.
   
   Adaptions: Search bar component design and search yFinance route

   Modifications: Adds debounce tactic to limit api calls as user types,
                  Expects onStockSelect callback to action adding stock to watchlist
*/

// Will be nested in the AddStockModal component
const WatchlistSearchBar = ({ onStockSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const searchRef = useRef(null);
    const debounceTimeout = useRef(null);
  
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
  
    
    // Implements debounce on search to limit api calls
    useEffect(() => {
      // Clear previous timeout if it exists
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Search 300ms after user stops typing and there are at least 2 letters
      if (query.length >= 2) {
        debounceTimeout.current = setTimeout(() => {
          handleSearch();
        }, 300); 
      } else {
        setResults([]);
      }
      
      // Clear timeout when component unmounts or query changes
      return () => {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, [query]);

    const handleSearch = async () => {
      console.log("***** INSIDE SEARCH! *****")
      if (!query) {
        setError('Please enter a query');
        return;
      }
  
      try {
        //const response = await fetch(`/api/search?query=${query}&max_results=5`);
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&max_results=5`);

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
      // if (e.target.value.length >= 2) {            // handled in debounce
      //   handleSearch();
      // }
    };
  
    return (
      <div className="search-wrapper" ref={searchRef}>
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search for stock to add"
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