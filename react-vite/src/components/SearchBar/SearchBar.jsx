import { useState } from 'react';

const SearchBar = () => {
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

    return (
        <div>
            <h1>Stock Search</h1>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter ticker or company name"
            />
            <button onClick={handleSearch}>Search</button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <ul>
                {results.map((result, index) => (
                    <li key={index}>
                        {result.name} ({result.symbol}) - {result.exchange}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SearchBar;