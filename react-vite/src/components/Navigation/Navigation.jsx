import { NavLink } from "react-router-dom";
import ProfileButton from "./ProfileButton";
import "./Navigation.css";

function Navigation() {
  return (
    <ul>
      <li>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/watchlists/2">Watchlist 2 Page</NavLink>
        <NavLink to="/Watchlists/2/component"> Test Watchlist Component </NavLink>
      </li>

      <li>
        <ProfileButton />
      </li>
    </ul>
  );
}

export default Navigation;
