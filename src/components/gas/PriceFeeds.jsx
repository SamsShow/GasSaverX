import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';

const PriceFeeds = () => {
  const [gasStats, setGasStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historicalGas, setHistoricalGas] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchGasData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchGasData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchGasData = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask to use this feature');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const currentGasPrice = Number(feeData.gasPrice) / 1e9; // Convert to Gwei
      
      // Calculate max priority fee
      const maxPriorityFee = Number(feeData.maxPriorityFeePerGas) / 1e9;

      // Get block information for more stats
      const block = await provider.getBlock('latest');
      const baseGasPrice = Number(block.baseFeePerGas) / 1e9;

      const formattedStats = {
        currentPrice: currentGasPrice,
        basePrice: baseGasPrice,
        maxPriorityFee: maxPriorityFee,
        totalPrice: baseGasPrice + maxPriorityFee
      };

      setGasStats(formattedStats);
      
      // Update historical data
      setHistoricalGas(prev => {
        const newData = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          price: formattedStats.totalPrice
        }].slice(-24); // Keep last 24 data points
        return newData;
      });
      
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch gas data');
      console.error('Gas data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Real-Time Gas Prices</CardTitle>
        <button
          onClick={fetchGasData}
          className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </CardHeader>
      <CardContent>
        {gasStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Total Gas Price</div>
              <div className="text-2xl font-bold">{gasStats.totalPrice.toFixed(2)} Gwei</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Base Fee</div>
              <div className="text-2xl font-bold">{gasStats.basePrice.toFixed(2)} Gwei</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Priority Fee</div>
              <div className="text-2xl font-bold">{gasStats.maxPriorityFee.toFixed(2)} Gwei</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Current Gas Price</div>
              <div className="text-2xl font-bold">{gasStats.currentPrice.toFixed(2)} Gwei</div>
            </div>
          </div>
        )}

        {historicalGas.length > 0 && (
          <div className="h-64">
            <h3 className="text-lg font-semibold mb-4">Gas Price History</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalGas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value.toFixed(1)} Gwei`}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)} Gwei`, 'Gas Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {lastUpdate && (
          <div className="text-sm text-gray-500 mt-4">
            Last updated: {lastUpdate.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceFeeds;