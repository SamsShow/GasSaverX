import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Database, Zap, AlertCircle } from 'lucide-react';

const PriceFeeds = () => {
  const [gasStats, setGasStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historicalGas, setHistoricalGas] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('total');

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
      
      let maxPriorityFee = 0;
      try {
        
        maxPriorityFee = Number(feeData.maxPriorityFeePerGas) / 1e9;
      } catch (priorityFeeError) {
        console.warn('Max priority fee not available:', priorityFeeError);
        
        maxPriorityFee = currentGasPrice * 0.1;
      }

      
      const block = await provider.getBlock('latest');
      let baseGasPrice = currentGasPrice;
      
      try {
        
        if (block && block.baseFeePerGas) {
          baseGasPrice = Number(block.baseFeePerGas) / 1e9;
        }
      } catch (baseFeeError) {
        console.warn('Base fee not available:', baseFeeError);
        
        baseGasPrice = currentGasPrice * 0.9;
      }

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
        }].slice(-24); // last 24 data points
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

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white p-4 rounded-lg relative shadow-sm`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex flex-col">
        <span className="text-gray-500 text-sm mb-1">{title}</span>
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold">{value} Gwei</span>
          <Icon className={`h-5 w-5`} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Stats Grid */}
      {gasStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Gas Price"
            value={gasStats.totalPrice.toFixed(2)}
            icon={TrendingUp}
            color="#4F46E5"
          />
          <StatCard
            title="Base Fee"
            value={gasStats.basePrice.toFixed(2)}
            icon={Database}
            color="#10B981"
          />
          <StatCard
            title="Priority Fee"
            value={gasStats.maxPriorityFee.toFixed(2)}
            icon={Zap}
            color="#F59E0B"
          />
          <StatCard
            title="Current Gas Price"
            value={gasStats.currentPrice.toFixed(2)}
            icon={RefreshCw}
            color="#8B5CF6"
          />
        </div>
      )}

      {/* Chart Section */}
      {historicalGas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Gas Price History</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchGasData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{loading ? 'Refreshing...' : 'Refresh'}</span>
            </motion.button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalGas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `${value.toFixed(1)} Gwei`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} Gwei`, 'Gas Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {lastUpdate && (
            <div className="text-sm text-gray-500 mt-4 text-right">
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceFeeds;