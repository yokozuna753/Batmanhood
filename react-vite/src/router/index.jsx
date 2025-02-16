import { createBrowserRouter } from "react-router-dom";
import LoginFormPage from "../components/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
import Layout from "./Layout";
import Portfolio from "../components/Portfolio/Portfolio";
import StockDetailsPage from "../components/StockDetail/StockDetailsPage";
import WatchlistPage from "../components/WatchlistPage/WatchlistPage";
import WatchlistComponent from "../components/WatchlistComponent";


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
        path: 'stocks/:stockId',
        element: <StockDetailsPage />
      },
      {
        path: 'watchlists/:watchlist_id',
        element: <WatchlistPage />
      },
      {
        path: 'watchlists/:user_id/component',
        element: <WatchlistComponent />
      }
    ],
  },
]);