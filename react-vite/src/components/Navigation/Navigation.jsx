import { NavLink } from "react-router-dom";
import ProfileButton from "./ProfileButton";
import SearchBar from '../SearchBar/SearchBar'

import "./Navigation.css";

function Navigation() {
  return (
    <ul>
  
      <li>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/Watchlists/2/component"> Test Watchlist Component </NavLink>
      </li>

      <li>
        <ProfileButton />
      </li>

      <li>
        <SearchBar />
      </li>
    </ul>


  );
}

export default Navigation;


/*
import { useState } from 'react';
import { redirect } from 'react-router-dom';

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

    //! make the tickers into buttons
        // on button click, redirect to stock detail page with ":ticker" in the params
*/