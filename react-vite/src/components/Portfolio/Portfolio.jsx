import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { loadPortfolio } from "../../redux/portfolio";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolioPrices } from "../../redux/portfolio";
import WatchlistComponent from "../../components/WatchlistComponent";
import "./Portfolio.css";

function Portfolio() {
  const sessionUser = useSelector((state) => state.session.user);
  const portfolio = useSelector((state) => state.portfolio);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const chartRef = useRef(null);
  const stockChartRefs = useRef([]);

  // useEffect(() => {
  //   if (sessionUser) {
  //     dispatch(loadPortfolio(sessionUser.id));
  //     const intervalId = setInterval(() => {
  //       dispatch(fetchPortfolioPrices(sessionUser.id));
  //     }, 10000);
  //     return () => clearInterval(intervalId);
  //   }
  // }, [dispatch, sessionUser]);

  // useEffect(() => {
  //   const data = [
  //     { year: 2010, count: 10 },
  //     { year: 2011, count: 20 },
  //     { year: 2012, count: 15 },
  //     { year: 2013, count: 25 },
  //     { year: 2014, count: 22 },
  //     { year: 2015, count: 30 },
  //     { year: 2016, count: 28 },
  //   ];
  //   const portfolioData = [];
  //   portfolioData.push(portfolio.livePortfolioValue);

  //   if (chartRef.current) {
  //     chartRef.current.destroy();
  //   }

  //   chartRef.current = new Chart(document.getElementById("acquisitions"), {
  //     type: "line",
  //     data: {
  //       labels: data.map(() => ""),
  //       datasets: [
  //         {
  //           label: "Portfolio Performance",
  //           data: [0, 0, ...portfolioData],
  //         },
  //       ],
  //     },
  //     options: {
  //       plugins: {
  //         legend: {
  //           display: false,
  //         },
  //       },
  //       responsive: false,
  //       maintainAspectRatio: false,
  //       scales: {
  //         x: {
  //           ticks: {
  //             font: {
  //               size: 10,
  //             },
  //           },
  //         },
  //         y: {
  //           display: false,
  //         },
  //       },
  //     },
  //   });

  //   return () => {
  //     if (chartRef.current) {
  //       chartRef.current.destroy();
  //     }
  //   };
  // }, [sessionUser, portfolio, dispatch]);

  // useEffect(() => {
  //   if (portfolio.tickers) {
  //     portfolio.tickers.forEach((stock, index) => {
  //       const history = stock.historical_data || [];
  //       const chartData = {
  //         labels: history.map((_, i) => `Day ${i + 1}`),
  //         datasets: [
  //           {
  //             label: `${stock.ticker} Performance`,
  //             data: history,
  //             borderColor: "rgb(22, 228, 60)",
  //             backgroundColor: "rgb(39, 235, 13)",
  //             fill: false,
  //             pointRadius: 0,
  //           },
  //         ],
  //       };

  //       const canvas = stockChartRefs.current[index];

  //       if (canvas && canvas.chartInstance) {
  //         canvas.chartInstance.destroy();
  //       }

  //       if (canvas) {
  //         canvas.chartInstance = new Chart(canvas, {
  //           type: "line",
  //           data: chartData,
  //           options: {
  //             plugins: {
  //               legend: {
  //                 display: false,
  //               },
  //             },
  //             responsive: true,
  //             maintainAspectRatio: false,
  //             scales: {
  //               x: {
  //                 type: "category",
  //                 ticks: {
  //                   font: {
  //                     size: 3,
  //                   },
  //                 },
  //               },
  //               y: {
  //                 display: false,
  //               },
  //             },
  //             layout: {
  //               padding: {
  //                 top: 0,
  //                 right: 0,
  //                 bottom: 0,
  //                 left: 0,
  //               },
  //             },
  //           },
  //         });
  //       }
  //     });
  //   }
  // }, [portfolio.tickers]);

  if (!sessionUser) {
    return <Navigate to="/login" replace={true} />;
  }

  return (
    <div id="portfolio-base">
      {sessionUser ? (
        <>
          <div className="left-column">
            <div id="canvas-div">
              <canvas id="acquisitions" width="400" height="250"></canvas>
            </div>
            
            <div>
              <h3>Holdings</h3>
              {portfolio.tickers ? (
                <ul>
                  {portfolio.tickers.map((stock, index) => (
                    <li key={stock.id}>
                      <div>
                        <p>{stock.ticker}</p>
                        <p>{stock.shares_owned} shares</p>
                      </div>
                      <div>
                        <canvas
                          ref={(el) => (stockChartRefs.current[index] = el)}
                          width="200"
                          height="100"
                          style={{
                            display: "block",
                            maxWidth: "180px",
                            maxHeight: "100px",
                          }}
                        ></canvas>
                      </div>
                      <div>
                        <h5>
                          ${Math.round(stock.stock_info.currentPrice * 100) / 100}
                        </h5>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <h1>Loading...</h1>
              )}
            </div>

            <div>
              <h3>News</h3>
              {portfolio.news ? (
                <ul>
                  {portfolio.news.map((ele) => (
                    <li key={ele.providerPublishTime}>
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
              ) : (
                <h1>Loading...</h1>
              )}
            </div>
          </div>

          <div className="right-column">
            <WatchlistComponent />
            <div id="bp-div">
              <h3 id="portfolio-buying-power">Buying power</h3>
              <h3 id="portfolio-money">
                ${sessionUser.account_balance.toString().includes(".")
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