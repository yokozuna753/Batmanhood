import { loadPortfolio } from "../../redux/portfolio";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "./Portfolio.css";
import { useEffect } from "react";

//  grab the user id from redux store
//

function Portfolio() {
  const sessionUser = useSelector((state) => state.session.user); // Access the user from Redux state
  const portfolio = useSelector((state) => state.portfolio)
  const dispatch = useDispatch();



  useEffect(() => {
    if (sessionUser) {
      dispatch(loadPortfolio(sessionUser.id));
    }
  }, [sessionUser, dispatch]);

  // If the user is not logged in, redirect to the login page
  if (!sessionUser) {
    return <Navigate to="/login" replace={true} />;
  }

  // const portfolioValue = portfolio.portfolio_value //* use this to render on the line chart 

  // now i want to render the stocks owned (IF ANY)

  return (
    <div id="portfolio-base">
      <h1>THIS IS PORTFOLIO</h1>
      {sessionUser ?
        <>
          <div>
            <h3 id="portfolio-buying-power">Buying power</h3>
            <h3 id="portfolio-money">${sessionUser.account_balance.toString().includes('.')
              ?
              sessionUser.account_balance :
              sessionUser.account_balance.toString() + ".00"
            }</h3>
          </div>
          <div>
            {portfolio.tickers
              ?
              <ul>
                {portfolio.tickers.map((stock) => {
                  return <li key={stock.id}>
                    <p>{stock.ticker} </p>
                    <p>{stock.shares_owned} shares </p>
                    <h5>${Math.round(stock.stock_info.currentPrice * 100) / 100} </h5>

                  </li>
                })}
              </ul>
              :
              console.log('hello')
            }
          </div>
        </>
        :
        console.log('hello')
      }

    </div>
  );
}

export default Portfolio;