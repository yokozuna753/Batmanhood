import { useEffect, useState, useRef } from "react";
import { loadPortfolio } from "../../redux/portfolio";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolioPrices } from "../../redux/portfolio";
import { thunkUpdateUserInfo } from "../../redux/session";
import WatchlistComponent from "../../components/WatchlistComponent";
import "./Portfolio.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Portfolio() {
  const sessionUser = useSelector((state) => state.session.user);
  const portfolio = useSelector((state) => state.portfolio);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("1D");
  const [portfolioChartData, setPortfolioChartData] = useState([
    { time: new Date().toISOString(), price: 0 },
  ]);
  const portfolioValueRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const holdingsPerPage = 5;

  const timeRanges = [
    { label: "1D", value: "1D" },
    { label: "1W", value: "1W" },
    { label: "1M", value: "1M" },
    { label: "1Y", value: "1Y" },
  ];

  useEffect(() => {
    dispatch(thunkUpdateUserInfo(sessionUser?.id));
  }, [dispatch, sessionUser?.id]);

  // Initial portfolio load and periodic price updates
  useEffect(() => {
    if (sessionUser) {
      // Initial portfolio load
      dispatch(loadPortfolio(sessionUser?.id));

      // Fetch portfolio prices every 2 minutes
      const intervalId = setInterval(() => {
        dispatch(fetchPortfolioPrices(sessionUser?.id));
      },  3600000); // 1 minute = 60000 milliseconds

      return () => clearInterval(intervalId);
    }
  }, [dispatch, sessionUser]);

  //* Update chart data when live portfolio value changes
  useEffect(() => {
    if (sessionUser && portfolio && portfolio.livePortfolioValue !== null) {
      const currentTime = new Date().toISOString();

      // If this is the first time we're getting a live portfolio value
      if (portfolioChartData.length === 0) {
        setPortfolioChartData([
          { time: currentTime, price: portfolio?.livePortfolioValue },
        ]);
        portfolioValueRef.current = portfolio?.livePortfolioValue;
      }
      // If the portfolio value has changed
      else if (portfolio.livePortfolioValue !== portfolioValueRef.current) {
        setPortfolioChartData((prevData) => {
          // Create a new array with the existing data and new data point
          const newData = [
            ...prevData,
            {
              time: currentTime,
              price: portfolio.livePortfolioValue,
            },
          ];

          // Limit to last 50 data points to prevent memory issues
          return newData.slice(-50);
        });

        // Update the ref to current value
        portfolioValueRef.current = portfolio.livePortfolioValue;
      }
    }
  }, [portfolio, portfolio.livePortfolioValue, portfolioChartData.length, sessionUser]);

  // Calculation for chart color and trend
  const latestPrice =
    portfolioChartData[portfolioChartData.length - 1]?.price || 0;
  const startPrice = portfolioChartData[0]?.price || 0;
  const isPositive = latestPrice >= startPrice;

  // Pagination logic
  const indexOfLastHolding = currentPage * holdingsPerPage;
  const indexOfFirstHolding = indexOfLastHolding - holdingsPerPage;
  const currentHoldings = portfolio.tickers ? portfolio.tickers.slice(indexOfFirstHolding, indexOfLastHolding) : [];
  
  const totalPages = portfolio.tickers ? Math.ceil(portfolio.tickers.length / holdingsPerPage) : 0;
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!sessionUser) {
    return <Navigate to="/login" replace={true} />;
  }

//   let requestCounter = 0;
// const maxRequestsPerMinute = 5;

// const fetchWithThrottle = (ticker) => {
//   if (requestCounter < maxRequestsPerMinute) {
//     requestCounter++;
//     dispatch(fetchPortfolioPrices(ticker));
//   } else {
//     setTimeout(() => {
//       fetchWithThrottle(ticker); // Try again after a delay
//     }, 60000); // Wait for 1 minute
//   }
// };

  return (
    <div id="portfolio-base">
      {sessionUser ? (
        <>
          <div className="left-column">
            <div className="chart-section-wrapper">
              <div className="chart-section">
                <div className="time-range-selector">
                  {timeRanges.map((range) => (
                    <button
                      key={range.value}
                      className={`time-range-button ${
                        timeRange === range.value ? "active" : ""
                      }`}
                      onClick={() => setTimeRange(range.value)}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={portfolioChartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                    >
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={
                          isPositive ? "rgb(0, 200, 5)" : "rgb(255, 80, 0)"
                        }
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                      />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(time) => {
                          const date = new Date(time);
                          return timeRange === "1D"
                            ? date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : date.toLocaleDateString([], {
                                month: "numeric",
                                day: "numeric",
                              });
                        }}
                        tick={{ fontSize: 12, fill: "#666" }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                        orientation="right"
                        tick={{ fontSize: 12, fill: "#666" }}
                        tickLine={false}
                        axisLine={false}
                        dx={10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "none",
                          borderRadius: "4px",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                          padding: "8px 12px",
                          fontSize: "14px",
                        }}
                        formatter={(value) => [`$${value.toFixed(2)}`, ""]}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return timeRange === "1D"
                            ? date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : date.toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              });
                        }}
                        cursor={{
                          stroke: "#ccc",
                          strokeWidth: 1,
                          strokeDasharray: "5 5",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="holdings-section">
              <div className="holdings-header">
                <h3>Holdings</h3>
                <div className="pagination-info">
                  {portfolio.tickers && portfolio.tickers.length > 0 && (
                    <span>Page {currentPage} of {totalPages}</span>
                  )}
                </div>
              </div>
              {portfolio.tickers && portfolio.tickers.length > 0 ? (
                <>
                  <ul>
                    {currentHoldings.map((stock, index) => (
                      <li key={`holding-${stock.id}-${stock.ticker}-${index}`}>
                        <div >
                          <p
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              console.log('STOCK HERE ==> ', stock);
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/stocks/${stock?.ticker}`);
                            }}
                          >
                            {stock.ticker}
                          </p>
                          <p>{stock.shares_owned} shares</p>
                        </div>
                        <div>
                          <h5>
                            $
                            {Math.round(stock.stock_info.currentPrice * 100) /
                              100}
                          </h5>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="pagination-controls">
                    <button 
                      className="pagination-button" 
                      onClick={prevPage} 
                      disabled={currentPage === 1}
                    >
                      &#8592;
                    </button>
                    <button 
                      className="pagination-button" 
                      onClick={nextPage} 
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      &#8594;
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-stocks-message">
                  <p>You haven&apos;t purchased any stocks yet.</p>
                </div>
              )}
            </div>

            <div className="news-section">
              <h3>News</h3>
              {portfolio.news ? (
                <ul className="news-section">
                  {portfolio.news.map((ele,index) => (
                    <li key={`news-${ele.providerPublishTime}-${index}`} className="news-section-li">
                      <button
                        onClick={() => {
                          let link = ele.link;
                          if (link.startsWith("/portfolio/")) {
                            link = link.replace("/portfolio/", "");
                          }
                          if (link.startsWith("http")) {
                            window.open(link, "_blank");
                          } else {
                            navigate(link);
                          }
                        }}
                      >
                        <h5>{ele.title}</h5>
                        <p>{ele.relatedTickers && ele.relatedTickers[0]}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="right-column">
            <WatchlistComponent />
            <div id="bp-div">
              <h3 id="portfolio-buying-power">Buying power</h3>
              <h3 id="portfolio-money">
                $
                {sessionUser.account_balance.toString().includes(".")
                  ? sessionUser.account_balance
                  : sessionUser.account_balance.toString() + ".00"}
              </h3>
            </div>
          </div>
        </>
      ) : (
        <h1>Please Sign In...</h1>
      )}
    </div>
  );
}

export default Portfolio;