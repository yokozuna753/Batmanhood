import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { loadPortfolio } from "../../redux/portfolio";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolioPrices } from "../../redux/portfolio";
import WatchlistComponent from "../../components/WatchlistComponent";
import "./Portfolio.css";

function Portfolio() {
  const sessionUser = useSelector((state) => state.session.user); // Access the user from Redux state
  const portfolio = useSelector((state) => state.portfolio);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use a ref to store the main chart instance
  const chartRef = useRef(null);

  // Use a ref array to store references to the individual stock charts
  const stockChartRefs = useRef([]);

  // !!!!!!!!!!! FOR THE DATA POINTS IN THE PORTFOLIO CHART,
  // ! use an ARRAY
  // ! every 5 seconds calculate the current price of each stock (see below)
  // ! add them up together and push it to the array of the chart

  useEffect(() => {
    if (sessionUser) {
      // Load portfolio initially
      dispatch(loadPortfolio(sessionUser.id));

      // Start the interval for fetching portfolio prices
      const intervalId = setInterval(() => {
        dispatch(fetchPortfolioPrices(sessionUser.id));
      }, 10000); // 5000 ms = 5 seconds

      // Cleanup the interval on component unmount or sessionUser change
      return () => clearInterval(intervalId);
    }
  }, [dispatch, sessionUser]);

  useEffect(() => {
    // the first data point should be $0 - account initiation
    // every data point is based on the performance of the portfolio
    // ! NOT based on account balance
    // 0 => 900 - next data point (stock purchase) =>

    // Sample data, update this to use user's portfolio performance
    const data = [
      { year: 2010, count: 10 },
      { year: 2011, count: 20 },
      { year: 2012, count: 15 },
      { year: 2013, count: 25 },
      { year: 2014, count: 22 },
      { year: 2015, count: 30 },
      { year: 2016, count: 28 },
    ];
    const portfolioData = [];
    portfolioData.push(portfolio.livePortfolioValue);
    // Destroy the main chart if it already exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create a new main chart
    chartRef.current = new Chart(document.getElementById("acquisitions"), {
      type: "line",
      data: {
        labels: data.map((row) => ""),
        datasets: [
          {
            label: "Portfolio Performance",
            data: [0, 0, ...portfolioData],
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
        },
        responsive: false,
        maintainAspectRatio: false, // Disable aspect ratio to allow for resizing
        scales: {
          x: {
            ticks: {
              font: {
                size: 10, // Smaller font size for x-axis
              },
            },
          },
          y: {
            display: false, // Hide y-axis for the main chart
          },
        },
      },
    });

    // Clean up the chart when the component is unmounted
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [sessionUser, portfolio, dispatch]);

  useEffect(() => {
    if (portfolio.tickers) {
      portfolio.tickers.forEach((stock, index) => {
        // Prepare data for individual stock charts
        const history = stock.historical_data || [];
        const chartData = {
          labels: history.map((_, i) => `Day ${i + 1}`), // Placeholder for labels like "Day 1", "Day 2", etc.
          datasets: [
            {
              label: `${stock.ticker} Performance`,
              data: history, // Stock prices (assuming they are closing prices)
              borderColor: "rgb(22, 228, 60)",
              backgroundColor: "rgb(39, 235, 13)",
              fill: false, // Fill the area under the curve
              pointRadius: 0,
            },
          ],
        };

        // Retrieve the canvas element for this stock chart
        const canvas = stockChartRefs.current[index];

        // If a chart exists, destroy it before creating a new one
        if (canvas && canvas.chartInstance) {
          canvas.chartInstance.destroy();
        }

        // Create a new chart for this stock, reusing the same canvas
        if (canvas) {
          canvas.chartInstance = new Chart(canvas, {
            type: "line",
            data: chartData,
            options: {
              plugins: {
                legend: {
                  display: false,
                },
              },
              responsive: true,
              maintainAspectRatio: false, // Allow chart to resize freely within its container
              scales: {
                x: {
                  type: "category", // X-axis as categorical (e.g., "Day 1", "Day 2", etc.)
                  ticks: {
                    font: {
                      size: 3, // Smaller font size for x-axis labels
                    },
                  },
                },
                y: {
                  display: false, // Hide the y-axis
                },
              },
              layout: {
                padding: {
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                },
              },
            },
          });
        }
      });
    }
  }, [portfolio.tickers]); // Re-run whenever portfolio.tickers changes

  // If the user is not logged in, redirect to the login page
  if (!sessionUser) {
    return <Navigate to="/login" replace={true} />;
  }

  // Portfolio chart - track performance of portfolio (everything combined)
  //! use a setInterval every 10 seconds to track the live value of each stock
  // first try loading the portfolio with a set interval every 10 seconds
  //
  // create a sum variable
  // 1. grab the live stock price.
  // 2. multiply the shares the user owns by the stock price
  // 3. add up all of those values together to the sum => portfolio value

  return (
    <div id="portfolio-base">
      <h1>THIS IS PORTFOLIO</h1>

      {sessionUser ? (
        <>
          <div id="canvas-div">
            <canvas id="acquisitions" width="400" height="250"></canvas>{" "}
            {/* Smaller main chart */}
          </div>
          <div id="bp-div">
            <h3 id="portfolio-buying-power">Buying power</h3>
            <h3 id="portfolio-money">
              $
              {sessionUser.account_balance.toString().includes(".")
                ? sessionUser.account_balance
                : sessionUser.account_balance.toString() + ".00"}
            </h3>
          </div>
          <div>
            <WatchlistComponent/>
          </div>
          <div>
            <h3>Holdings</h3>
            {portfolio.tickers ? (
              <ul>
                {portfolio.tickers.map((stock, index) => {
                  return (
                    <li key={stock.id}>
                      <div>
                        <p>{stock.ticker} </p>
                        <p>{stock.shares_owned} shares </p>
                      </div>
                      {/* Render the individual stock chart (smaller version) */}
                      <div>
                        <canvas
                          ref={(el) => (stockChartRefs.current[index] = el)} // Set ref to each canvas element
                          width="200" // Set a reasonable width for the smaller chart
                          height="100" // Set a fixed height for the smaller chart
                          style={{
                            display: "block",
                            maxWidth: "180px",
                            maxHeight: "100px",
                          }} // CSS to ensure size restrictions
                        ></canvas>
                      </div>
                      <div>
                        <h5>
                          $
                          {Math.round(stock.stock_info.currentPrice * 100) /
                            100}{" "}
                        </h5>
                      </div>


                    </li>
                  );
                })}
              </ul>
            ) : (
              <h1> Loading... </h1>
            )}
          </div>
          <div>
            <h3>News</h3>
            {portfolio.news ? (
              <ul>
                {portfolio.news.map((ele) => {
                  return (
                    <li key={ele.providerPublishTime}>
                      <button
                        onClick={() => {
                          let link = ele.link;
                          console.log("Original link:", link); // Debugging log

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
                        <h5>{ele.title} </h5>
                        <p>{ele.relatedTickers && ele.relatedTickers[0]} </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <h1> Loading... </h1>
            )}
          </div>
        </>
      ) : (
        <h1>Please Sign In...</h1>
      )}
    </div>
  );
}

export default Portfolio;