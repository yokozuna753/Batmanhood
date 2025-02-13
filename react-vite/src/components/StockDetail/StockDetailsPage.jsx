import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Sample data for preview
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

const StockDetailsPage = () => {
  const [stockDetails, setStockDetails] = useState(SAMPLE_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tradeForm, setTradeForm] = useState({
    orderType: 'Buy Order',
    buyIn: 'Dollars',
    shares: '',
    amount: '',
  });
  const [tradeError, setTradeError] = useState(null);
  const [tradeSuccess, setTradeSuccess] = useState(null);

  const priceChange = stockDetails.regularMarketPrice - stockDetails.previousClose;
  const priceChangePercent = (priceChange / stockDetails.previousClose) * 100;
  const isPositive = priceChange >= 0;

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    setTradeError(null);
    setTradeSuccess(null);
    
    setTimeout(() => {
      setTradeSuccess('Trade executed successfully!');
      setStockDetails(prev => ({
        ...prev,
        shares_owned: tradeForm.orderType === 'Buy Order' 
          ? prev.shares_owned + Number(tradeForm.shares || 0)
          : prev.shares_owned - Number(tradeForm.shares || 0)
      }));
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white">
      {/* Stock Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium mb-2">{stockDetails.ticker}</h1>
        <div className="text-4xl font-light mb-2">
          ${stockDetails.regularMarketPrice.toFixed(2)}
        </div>
        <div className={`flex items-center text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
          <span className="ml-1">
            ${Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Price Chart */}
      <div className="mb-8 h-64">
        <LineChart width={800} height={250} data={stockDetails.priceHistory}>
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={isPositive ? '#00C805' : '#FF5000'}
            strokeWidth={2} 
            dot={false}
          />
          <XAxis dataKey="time" hide={true} />
          <YAxis domain={['auto', 'auto']} hide={true} />
          <Tooltip />
        </LineChart>
      </div>

      {/* Trading Section */}
      <div className="mb-8">
        <div className="flex space-x-4 mb-4">
          <button 
            className={`flex-1 py-2 text-center rounded-lg ${
              tradeForm.orderType === 'Buy Order' 
                ? 'bg-black text-white' 
                : 'bg-gray-100'
            }`}
            onClick={() => setTradeForm(prev => ({...prev, orderType: 'Buy Order'}))}
          >
            Buy {stockDetails.ticker}
          </button>
          <button 
            className={`flex-1 py-2 text-center rounded-lg ${
              tradeForm.orderType === 'Sell Order' 
                ? 'bg-black text-white' 
                : 'bg-gray-100'
            }`}
            onClick={() => setTradeForm(prev => ({...prev, orderType: 'Sell Order'}))}
          >
            Sell {stockDetails.ticker}
          </button>
        </div>

        <form onSubmit={handleTradeSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                className="pl-6 text-lg h-12"
                type="number"
                value={tradeForm.amount}
                onChange={(e) => setTradeForm(prev => ({...prev, amount: e.target.value}))}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          {tradeError && <Alert variant="destructive"><AlertDescription>{tradeError}</AlertDescription></Alert>}
          {tradeSuccess && (
            <Alert className="bg-green-50 border-green-500">
              <AlertDescription>{tradeSuccess}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-black hover:bg-gray-800 text-white"
          >
            Review Order
          </Button>
        </form>
      </div>

      {/* Position Info */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-medium mb-4">Your Position</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Shares</p>
            <p className="text-lg">{stockDetails.shares_owned}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Cost</p>
            <p className="text-lg">${stockDetails.estimated_cost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-medium mb-4">Order History</h2>
        <div className="space-y-4">
          {stockDetails.OrderHistory.map((order) => (
            <div key={order.id} className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">{order.order_type}</p>
                <p className="text-sm text-gray-500">{order.date}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{order.shares} shares at ${order.price}</p>
                <p className="text-sm text-gray-500">
                  Total: ${(order.shares * order.price).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockDetailsPage;