import React, { useState } from 'react';

const StockSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

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
    // Navigate to the stock detail page using window.location
    window.location.href = `/stocks/${symbol}`;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Stock Search</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter ticker or company name"
          className="px-3 py-2 border rounded"
        />
        <button 
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="flex flex-col gap-2">
        {results.map((result, index) => (
          <button
            key={index}
            onClick={() => handleStockSelect(result.symbol)}
            className="text-left p-3 border rounded hover:bg-gray-100"
          >
            {result.name} ({result.symbol}) - {result.exchange}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StockSearch;