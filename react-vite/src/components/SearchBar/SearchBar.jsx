import { useState, useRef, useEffect } from 'react';
import './SearchBar.css';

const StockSearch = () => {
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

  const handleStockSelect = (symbol) => {
    window.location.href = `/stocks/${symbol}`;
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
              onClick={() => handleStockSelect(result.symbol)}
              className="search-result-item"
            >
              <div>
                <span className="stock-symbol">{result.symbol}</span>
                <span className="stock-name"> • {result.name}</span>
              </div>
              <span className="stock-exchange">{result.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;