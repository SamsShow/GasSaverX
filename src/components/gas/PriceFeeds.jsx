import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';

const PriceFeeds = ({ contract }) => {
  const [priceData, setPriceData] = useState(null);
  const [historicalPrices, setHistoricalPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (contract) {
      fetchPriceData();
      const interval = setInterval(fetchPriceData, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [contract]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const data = await contract.latestPriceData();
      setPriceData({
        ethUsdPrice: Number(data.ethUsdPrice) / 1e8, // Assuming 8 decimals
        lastUpdate: new Date(Number(data.lastUpdate) * 1000)
      });
      
      // Add to historical data
      setHistoricalPrices(prev => {
        const newData = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          price: Number(data.ethUsdPrice) / 1e8
        }];
        // Keep last 24 data points
        return newData.slice(-24);
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch price data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Price Feeds</h2>
        <button
          onClick={fetchPriceData}
          className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span>ETH/USD Price</span>
          </div>
          <p className="text-3xl font-bold">
            ${priceData ? priceData.ethUsdPrice.toFixed(2) : '-'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdate ? lastUpdate.toLocaleString() : '-'}
          </p>
        </div>
      </div>

      {historicalPrices.length > 0 && (
        <div className="h-64 mt-6">
          <h3 className="text-lg font-semibold mb-4">Price History (24h)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalPrices}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PriceFeeds;