import { createBrowserRouter } from "react-router-dom";
import LoginFormPage from "../components/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
import Layout from "./Layout";
import Portfolio from "../components/Portfolio/Portfolio";
import WatchlistPage from "../components/WatchlistPage/WatchlistPage";


export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <h1>Hello</h1>,
      },
      {
        path: "login",
        element: <LoginFormPage />,
      },
      {
        path: "signup",
        element: <SignupFormPage />,
      },
      {
        path: 'portfolio',
        element: <Portfolio />
      },
      {
        path: 'watchlists/:watchlist_id',
        element: <WatchlistPage />
      }
    ],
  },
]);
