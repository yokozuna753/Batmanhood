import { NavLink } from "react-router-dom";
import ProfileButton from "./ProfileButton";
import TestWatchlistComponent from "../TestWatchlistComponent";
import "./Navigation.css";

function Navigation() {
  return (
    <ul>
      <TestWatchlistComponent />
      <li>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/Watchlists/2/component"> Test Watchlist Component </NavLink>
      </li>

      <li>
        <ProfileButton />
      </li>
    </ul>
  );
}

export default Navigation;
