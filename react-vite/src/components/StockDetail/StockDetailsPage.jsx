import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDollarSign,
  faSpinner,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import {
  getStockDetails,
  executeTrade,
  executeTradeByTicker,
} from "../../redux/stocks";
import "./StockDetails.css";

const StockChart = ({ stockDetails, timeRange, onTimeRangeChange }) => {
  const timeRanges = [
    { label: "1D", value: "1D" },
    { label: "1W", value: "1W" },
    { label: "1M", value: "1M" },
    { label: "1Y", value: "1Y" },
  ];

  const chartData = stockDetails?.priceHistory?.[timeRange] || [];
  const latestPrice = chartData[chartData.length - 1]?.price || 0;
  const startPrice = chartData[0]?.price || latestPrice;
  const isPositive = latestPrice >= startPrice;

  return (
    <div className="chart-section">
      <div className="time-range-selector">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            className={`time-range-button ${
              timeRange === range.value ? "active" : ""
            }`}
            onClick={() => onTimeRangeChange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
          >
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "rgb(0, 200, 5)" : "rgb(255, 80, 0)"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
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
  );
};

const StockDetailsPage = () => {
  const { stockId } = useParams();
  const dispatch = useDispatch();

  const stockDetails = useSelector((state) => state.stocks.currentStock);
  const loading = useSelector((state) => state.stocks.loading);
  const error = useSelector((state) => state.stocks.error);
  const tradeSuccess = useSelector((state) => state.stocks.tradeSuccess);
  const tradeError = useSelector((state) => state.stocks.tradeError);
  const tradeLoading = useSelector((state) => state.stocks.tradeLoading);
  const [timeRange, setTimeRange] = useState("1D");
  const [tradeForm, setTradeForm] = useState({
    orderType: "Market Order",
    buyIn: "Dollars",
    shares: "",
    amount: "",
    limitPrice: 0,
  });

  useEffect(() => {
    if (stockId) {
      dispatch(getStockDetails(stockId));
    }
  }, [dispatch, stockId]);

  // useEffect(() => {
  //   if (!stockDetails) return null;
  // }, [stockDetails]);

  if (loading)
    return (
      <div className="loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Loading stock details...</span>
      </div>
    );

  if (error)
    return (
      <div className="error-message">
        <h2>Error Loading Stock Details</h2>
        <p>{error}</p>
      </div>
    );

  if (!stockDetails) return null;

  // Get latest price from 1D data
  const currentPriceData =
    stockDetails.priceHistory?.["1D"]?.slice(-1)[0] || {};
  const regularMarketPrice = currentPriceData.price || 0;
  const sharesOwned = stockDetails.shares_owned || 0;
  const estimatedCost = stockDetails.estimated_cost || 0;
  const marketValue = sharesOwned * regularMarketPrice;
  const averageCost = sharesOwned > 0 ? estimatedCost / sharesOwned : 0;
  const totalReturn = marketValue - estimatedCost;

  // Calculate price change
  const previousClose = stockDetails.previousClose || 0;
  const priceChange = regularMarketPrice - previousClose;
  const priceChangePercent = (priceChange / previousClose) * 100;
  const isPositive = priceChange >= 0;

  const handleTradeSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if already submitting
    if (tradeLoading) {
      return;
    }

    // Form validation
    if (
      tradeForm.buyIn === "Dollars" &&
      (!tradeForm.amount || tradeForm.amount <= 0)
    ) {
      return;
    }
    if (
      tradeForm.buyIn === "Shares" &&
      (!tradeForm.shares || tradeForm.shares <= 0)
    ) {
      return;
    }

    const tradeData = {
      order_type: tradeForm.orderType,
      buy_in: tradeForm.buyIn,
      shares: tradeForm.buyIn === "Shares" ? Number(tradeForm.shares) : null,
      amount: tradeForm.buyIn === "Dollars" ? Number(tradeForm.amount) : null,
      limit_price: tradeForm.limitPrice || 0,
      ticker: stockDetails.ticker,
    };

    try {
      let success;

      // If we have a stockId parameter (existing position), use the original route
      if (stockId) {
        success = await dispatch(executeTrade(stockId, tradeData));
      } else {
        // Otherwise use the ticker-based route for new positions
        success = await dispatch(
          executeTradeByTicker(stockDetails.ticker, tradeData)
        );
      }

      if (success) {
        setTradeForm((prev) => ({
          ...prev,
          shares: "",
          amount: "",
          limitPrice: 0,
        }));

        // Refresh stock details
        if (stockId) {
          dispatch(getStockDetails(stockId));
        } else {
          dispatch(getStockDetails(stockDetails.ticker));
        }
      }
    } catch (error) {
      console.error("Trade failed:", error);
    }
  };

  return (
    <div className="stock-details">
      <div className="stock-header">
        <h1>{stockDetails.ticker}</h1>
        <div className="current-price">${regularMarketPrice.toFixed(2)}</div>
        <div className={`price-change ${isPositive ? "positive" : "negative"}`}>
          <FontAwesomeIcon icon={isPositive ? faArrowUp : faArrowDown} />
          <span>
            ${Math.abs(priceChange).toFixed(2)} (
            {Math.abs(priceChangePercent).toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="main-content">
        <div className="chart-section-wrapper">
          {stockDetails && (
            <StockChart
              stockDetails={stockDetails}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}
        </div>

        <div className="trade-form">
          <div className="trade-type-buttons">
            <button
              type="button"
              className={`trade-button ${
                tradeForm.orderType === "Market Order" ? "active" : ""
              }`}
              onClick={() =>
                setTradeForm((prev) => ({ ...prev, orderType: "Market Order" }))
              }
            >
              Buy {stockDetails.ticker}
            </button>
            <button
              type="button"
              className={`trade-button ${
                tradeForm.orderType === "Limit Order" ? "active" : ""
              }`}
              onClick={() =>
                setTradeForm((prev) => ({ ...prev, orderType: "Limit Order" }))
              }
            >
              Sell {stockDetails.ticker}
            </button>
          </div>

          <form onSubmit={handleTradeSubmit}>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="buyIn"
                  value="Dollars"
                  checked={tradeForm.buyIn === "Dollars"}
                  onChange={(e) =>
                    setTradeForm((prev) => ({ ...prev, buyIn: e.target.value }))
                  }
                />
                <span>Dollars</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="buyIn"
                  value="Shares"
                  checked={tradeForm.buyIn === "Shares"}
                  onChange={(e) =>
                    setTradeForm((prev) => ({ ...prev, buyIn: e.target.value }))
                  }
                />
                <span>Shares</span>
              </label>
            </div>

            {tradeForm.buyIn === "Dollars" ? (
              <div className="input-group">
                <label>Amount</label>
                <div className="dollar-input">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="dollar-sign"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tradeForm.amount}
                    onChange={(e) =>
                      setTradeForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <div className="input-group">
                <label>Shares</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tradeForm.shares}
                  onChange={(e) =>
                    setTradeForm((prev) => ({
                      ...prev,
                      shares: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            )}

            {tradeForm.orderType === "Limit Order" && (
              <div className="input-group">
                <label>Limit Price</label>
                <div className="dollar-input">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="dollar-sign"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tradeForm.limitPrice}
                    onChange={(e) =>
                      setTradeForm((prev) => ({
                        ...prev,
                        limitPrice: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {(tradeError || tradeSuccess) && (
              <div
                className={`message ${
                  tradeError ? "error-message" : "success-message"
                }`}
              >
                {tradeError || tradeSuccess}
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={
                (tradeForm.buyIn === "Dollars" &&
                  (!tradeForm.amount || tradeForm.amount <= 0)) ||
                (tradeForm.buyIn === "Shares" &&
                  (!tradeForm.shares || tradeForm.shares <= 0))
              }
            >
              Review {tradeForm.orderType}
            </button>
          </form>
        </div>
      </div>

      <div className="bottom-section">
        <div className="position-card">
          <h2>Your Position</h2>
          <div className="position-grid">
            <div>
              <p className="label">Shares Owned</p>
              <p className="value">{sharesOwned}</p>
            </div>
            <div>
              <p className="label">Average Cost</p>
              <p className="value">${averageCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="label">Market Value</p>
              <p className="value">${marketValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="label">Total Return</p>
              <p
                className={`value ${
                  totalReturn >= 0 ? "positive" : "negative"
                }`}
              >
                ${totalReturn.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="history-card">
          <h2>Order History</h2>
          <div className="order-list">
            {(stockDetails.OrderHistory || []).map((order) => (
              <div key={order.id} className="order-item">
                <div>
                  <p className="order-type">{order.order_type}</p>
                  <p className="order-date">
                    {order.date
                      ? new Date(order.date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="order-details">
                  <p>{order.shares} shares</p>
                  <p className="price">${order.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

//

export default StockDetailsPage;
