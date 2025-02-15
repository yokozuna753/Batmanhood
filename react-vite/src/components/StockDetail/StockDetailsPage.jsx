import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getStockDetails, executeTrade } from "../../redux/stocks";
import "./StockDetails.css";

const StockDetailsPage = ({ stockId }) => {
  const dispatch = useDispatch();
  
  // Replace useState with useSelector for Redux state
  const stockDetails = useSelector(state => state.stocks.currentStock) || SAMPLE_DATA;
  const loading = useSelector(state => state.stocks.loading);
  const error = useSelector(state => state.stocks.error);
  const tradeSuccess = useSelector(state => state.stocks.tradeSuccess);
  const tradeError = useSelector(state => state.stocks.tradeError);

  // Keep tradeForm as local state since it's form data
  const [tradeForm, setTradeForm] = useState({
    orderType: 'Buy Order',
    buyIn: 'Dollars',
    shares: '',
    amount: '',
  });

  // Use Redux thunk action 
  useEffect(() => {
    if (stockId) {
      dispatch(getStockDetails(stockId));
    }
  }, [dispatch, stockId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stockDetails) return null;

  const priceChange = stockDetails.regularMarketPrice - stockDetails.previousClose;
  const priceChangePercent = (priceChange / stockDetails.previousClose) * 100;
  const isPositive = priceChange >= 0;

  // Use Redux thunk action for trade submission
  const handleTradeSubmit = async (e) => {
    e.preventDefault();

    const tradeData = {
      order_type: tradeForm.orderType,
      buy_in: tradeForm.buyIn,
      shares: tradeForm.buyIn === 'Shares' ? Number(tradeForm.shares) : null,
      amount: tradeForm.buyIn === 'Dollars' ? Number(tradeForm.amount) : null,
    };

    await dispatch(executeTrade(stockId, tradeData));

    // Only reset form if there's no trade error
    if (!tradeError) {
      setTradeForm(prev => ({
        ...prev,
        shares: '',
        amount: ''
      }));
    }
  };

  return (
    <div className="stock-details">
      {/* Stock Header */}
      <div className="stock-header">
        <h1>{stockDetails.ticker}</h1>
        <div className="current-price">
          ${stockDetails.regularMarketPrice.toFixed(2)}
        </div>
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          <i className={`fas fa-${isPositive ? 'arrow-up' : 'arrow-down'}`}></i>
          <span>
            ${Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Chart and Trading Section */}
      <div className="main-content">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockDetails.priceHistory}>
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? '#00C805' : '#FF5000'}
                strokeWidth={2} 
                dot={false}
              />
              <XAxis dataKey="time" />
              <YAxis 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="trade-form">
          <div className="trade-type-buttons">
            <button 
              className={`trade-button ${tradeForm.orderType === 'Buy Order' ? 'active' : ''}`}
              onClick={() => setTradeForm(prev => ({...prev, orderType: 'Buy Order'}))}
            >
              Buy
            </button>
            <button 
              className={`trade-button ${tradeForm.orderType === 'Sell Order' ? 'active' : ''}`}
              onClick={() => setTradeForm(prev => ({...prev, orderType: 'Sell Order'}))}
            >
              Sell
            </button>
          </div>

          <form onSubmit={handleTradeSubmit}>
            <div className="radio-group">
              <label>
                <input 
                  type="radio"
                  name="buyIn"
                  value="Dollars"
                  checked={tradeForm.buyIn === 'Dollars'}
                  onChange={(e) => setTradeForm(prev => ({...prev, buyIn: e.target.value}))}
                />
                <span>Dollars</span>
              </label>
              <label>
                <input 
                  type="radio"
                  name="buyIn"
                  value="Shares"
                  checked={tradeForm.buyIn === 'Shares'}
                  onChange={(e) => setTradeForm(prev => ({...prev, buyIn: e.target.value}))}
                />
                <span>Shares</span>
              </label>
            </div>

            {tradeForm.buyIn === 'Dollars' ? (
              <div className="input-group">
                <label>Amount</label>
                <div className="dollar-input">
                  <span className="dollar-sign">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tradeForm.amount}
                    onChange={(e) => setTradeForm(prev => ({...prev, amount: e.target.value}))}
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
                  onChange={(e) => setTradeForm(prev => ({...prev, shares: e.target.value}))}
                  placeholder="0"
                />
              </div>
            )}

            {tradeError && <div className="error-message">{tradeError}</div>}
            {tradeSuccess && <div className="success-message">{tradeSuccess}</div>}

            <button type="submit" className="submit-button">
              Review {tradeForm.orderType}
            </button>
          </form>
        </div>
      </div>

      {/* Position and History */}
      <div className="bottom-section">
        <div className="position-card">
          <h2>Your Position</h2>
          <div className="position-grid">
            <div>
              <p className="label">Shares Owned</p>
              <p className="value">{stockDetails.shares_owned}</p>
            </div>
            <div>
              <p className="label">Average Cost</p>
              <p className="value">${stockDetails.estimated_cost.toFixed(2)}</p>
            </div>
            <div>
              <p className="label">Market Value</p>
              <p className="value">
                ${(stockDetails.shares_owned * stockDetails.regularMarketPrice).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="label">Total Return</p>
              <p className={`value ${
                stockDetails.shares_owned * (stockDetails.regularMarketPrice - stockDetails.estimated_cost) >= 0 
                  ? 'positive' 
                  : 'negative'
              }`}>
                ${(stockDetails.shares_owned * (stockDetails.regularMarketPrice - stockDetails.estimated_cost)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="history-card">
          <h2>Order History</h2>
          <div className="order-list">
            {stockDetails.OrderHistory.map((order) => (
              <div key={order.id} className="order-item">
                <div>
                  <p className="order-type">{order.order_type}</p>
                  <p className="order-date">{new Date(order.date).toLocaleDateString()}</p>
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

// Keep SAMPLE_DATA for initial/fallback state
const SAMPLE_DATA = {
  id: 1,
  ticker: 'AAPL',
  shares_owned: 10,
  estimated_cost: 150.25,
  regularMarketPrice: 178.50,
  previousClose: 176.50,
  OrderHistory: [
    { id: 1, order_type: 'Buy Order', shares: 5, price: 148.50, date: '2024-02-13' },
    { id: 2, order_type: 'Buy Order', shares: 5, price: 152.00, date: '2024-02-12' },
  ],
  priceHistory: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    price: 170 + Math.sin(i / 3) * 10
  }))
};

export default StockDetailsPage;