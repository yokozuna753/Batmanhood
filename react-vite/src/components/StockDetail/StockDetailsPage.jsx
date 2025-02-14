import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, DollarSign } from 'lucide-react';

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

const StockDetailsPage = ({ stockId }) => {
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

  // Fetch real data when stockId is provided
  useEffect(() => {
    const fetchStockDetails = async () => {
      if (!stockId) return; // Don't fetch if no stockId

      setLoading(true);
      try {
        const response = await fetch(`/api/stocks/${stockId}`);
        if (!response.ok) throw new Error('Failed to fetch stock details');
        const data = await response.json();
        setStockDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetails();
  }, [stockId]);

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!stockDetails) return null;

  const priceChange = stockDetails.regularMarketPrice - stockDetails.previousClose;
  const priceChangePercent = (priceChange / stockDetails.previousClose) * 100;
  const isPositive = priceChange >= 0;

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    setTradeError(null);
    setTradeSuccess(null);

    // Mock successful trade for preview
    if (!stockId) {
      setTradeSuccess('Trade executed successfully! (Preview Mode)');
      setStockDetails(prev => ({
        ...prev,
        shares_owned: tradeForm.orderType === 'Buy Order' 
          ? prev.shares_owned + (Number(tradeForm.shares) || 0)
          : prev.shares_owned - (Number(tradeForm.shares) || 0)
      }));
      return;
    }

    try {
      const response = await fetch(`/api/stocks/${stockId}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': document.cookie.match(/csrf_token=([\w-]+)/)?.[1],
        },
        body: JSON.stringify({
          order_type: tradeForm.orderType,
          buy_in: tradeForm.buyIn,
          shares: tradeForm.buyIn === 'Shares' ? Number(tradeForm.shares) : null,
          amount: tradeForm.buyIn === 'Dollars' ? Number(tradeForm.amount) : null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Trade failed');
      
      setTradeSuccess('Trade executed successfully!');
      // Refresh stock details after successful trade
      const updatedDetails = await fetch(`/api/stocks/${stockId}`).then(res => res.json());
      setStockDetails(updatedDetails);
    } catch (err) {
      setTradeError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Stock Header */}
      <Card className="p-6 mb-4">
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
      </Card>

      {/* Chart and Trading Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="h-64">
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
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Trading Form */}
        <Card className="p-4">
          <div className="flex space-x-2 mb-4">
            <Button 
              variant={tradeForm.orderType === 'Buy Order' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTradeForm(prev => ({...prev, orderType: 'Buy Order'}))}
            >
              Buy
            </Button>
            <Button 
              variant={tradeForm.orderType === 'Sell Order' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTradeForm(prev => ({...prev, orderType: 'Sell Order'}))}
            >
              Sell
            </Button>
          </div>

          <form onSubmit={handleTradeSubmit} className="space-y-4">
            <RadioGroup
              value={tradeForm.buyIn}
              onValueChange={(value) => setTradeForm(prev => ({...prev, buyIn: value}))}
              className="flex space-x-4 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Dollars" id="dollars" />
                <Label htmlFor="dollars">Dollars</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Shares" id="shares" />
                <Label htmlFor="shares">Shares</Label>
              </div>
            </RadioGroup>

            {tradeForm.buyIn === 'Dollars' ? (
              <div>
                <Label>Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    type="number"
                    className="pl-8"
                    value={tradeForm.amount}
                    onChange={(e) => setTradeForm(prev => ({...prev, amount: e.target.value}))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label>Shares</Label>
                <Input
                  type="number"
                  value={tradeForm.shares}
                  onChange={(e) => setTradeForm(prev => ({...prev, shares: e.target.value}))}
                  placeholder="0"
                />
              </div>
            )}

            {tradeError && (
              <Alert variant="destructive">
                <AlertDescription>{tradeError}</AlertDescription>
              </Alert>
            )}
            
            {tradeSuccess && (
              <Alert className="bg-green-50 border-green-500">
                <AlertDescription>{tradeSuccess}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full">
              Review {tradeForm.orderType}
            </Button>
          </form>
        </Card>
      </div>

      {/* Position and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Your Position</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Shares Owned</p>
              <p className="text-lg">{stockDetails.shares_owned}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Cost</p>
              <p className="text-lg">${stockDetails.estimated_cost.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Order History</h2>
          <div className="space-y-4">
            {stockDetails.OrderHistory.map((order) => (
              <div key={order.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{order.order_type}</p>
                  <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p>{order.shares} shares</p>
                  <p className="text-sm text-gray-500">${order.price}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StockDetailsPage;