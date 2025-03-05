import { useNavigate } from "react-router-dom";
import ProfileButton from "./ProfileButton";
import SearchBar from "../SearchBar/SearchBar";
import { useDispatch, useSelector } from "react-redux";
import "./Navigation.css";
import { thunkUpdateUserInfo } from "../../redux/session";

function Navigation() {
  const sessionUser = useSelector((state) => state.session.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleHomeClick(e){
    e.preventDefault();
    await dispatch(thunkUpdateUserInfo(sessionUser.id))
    navigate('/');
  }
  return (
    <nav>
      <ul>
        <li>
          <button style={{ background: 'transparent', border: 'none', color: 'white', cursor: "pointer" }} onClick={handleHomeClick}>Home</button>
        </li>

        <li>
          <SearchBar />
        </li>

        <li>
          <ProfileButton />
        </li>
      </ul>
    </nav>
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
