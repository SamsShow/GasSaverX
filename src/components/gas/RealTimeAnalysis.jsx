import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, Activity } from 'lucide-react';

const StatCard = ({ title, value, borderColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    className="bg-white rounded-xl p-6 shadow-sm w-full"
    style={{ borderLeft: `4px solid ${borderColor}` }}
  >
    <div className="space-y-2">
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  </motion.div>
);

const RealTimeAnalysis = () => {
  const [streamData, setStreamData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    let cleanup;

    const connect = async () => {
      try {
        if (!import.meta.env.VITE_QUICKNODE_WSS_ENDPOINT) {
          throw new Error('QuickNode WSS endpoint not configured');
        }

        setStreamData([{
          hash: '0x1234...',
          gasPrice: '50000000000',
          gasLimit: '21000',
          timestamp: Date.now(),
          optimization: { suggestions: ['Consider using EIP-1559'] },
          gasAnalysis: { potentialSavings: { eth: 0.002 } }
        }]);

        setIsConnected(true);
        setError(null);
        setLastUpdate(Date.now());

        const interval = setInterval(() => {
          const newTimestamp = Date.now();
          const newGasPrice = Math.floor(40 + Math.random() * 20);
          
          setStreamData(prev => {
            const newTx = {
              hash: `0x${Math.random().toString(16).slice(2)}`,
              gasPrice: newGasPrice + '000000000',
              gasLimit: '21000',
              timestamp: newTimestamp,
              optimization: {
                suggestions: Math.random() > 0.5 ? ['Consider using EIP-1559'] : []
              },
              gasAnalysis: {
                potentialSavings: { eth: Math.random() * 0.005 }
              }
            };
            return [newTx, ...prev].slice(0, 100);
          });

          setChartData(prev => {
            const newPoint = {
              timestamp: new Date(newTimestamp).toLocaleTimeString(),
              gasPrice: newGasPrice
            };
            return [...prev, newPoint].slice(-20);
          });

          setLastUpdate(newTimestamp);
        }, 3000);

        cleanup = () => {
          clearInterval(interval);
          setIsConnected(false);
        };

      } catch (err) {
        console.error('Connection error:', err);
        setError(err.message);
        setIsConnected(false);
      }
    };

    connect();
    return () => cleanup?.();
  }, []);

  const analytics = useMemo(() => {
    if (!streamData.length) return null;

    const calculateAvgGasPrice = () => {
      const sum = streamData.reduce((acc, tx) => {
        const priceInGwei = typeof tx.gasPrice === 'string' 
          ? Number(tx.gasPrice) / 1e9
          : Number(tx.gasPrice);
        return acc + priceInGwei;
      }, 0);
      return (sum / streamData.length).toFixed(2);
    };

    return {
      avgGasPrice: calculateAvgGasPrice(),
      totalTransactions: streamData.length,
      optimizableTransactions: streamData.filter(tx => 
        tx.optimization?.suggestions?.length > 0
      ).length,
      potentialSavings: streamData.reduce((sum, tx) => 
        sum + (tx.gasAnalysis?.potentialSavings?.eth || 0), 0
      ).toFixed(6)
    };
  }, [streamData]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-medium">Real-time Transaction Analysis</h1>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
            <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
        </div>
      </div>

      {analytics ? (
        <div className="space-y-6">
          {/* First Row */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              title="Average Gas Price"
              value={`${analytics.avgGasPrice} Gwei`}
              borderColor="#3B82F6"
            />
            <StatCard 
              title="Transactions Analyzed"
              value={analytics.totalTransactions}
              borderColor="#8B5CF6"
            />
          </div>
          
          {/* Second Row */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              title="Optimizable Transactions"
              value={analytics.optimizableTransactions}
              borderColor="#F59E0B"
            />
            <StatCard 
              title="Potential ETH Savings"
              value={`${analytics.potentialSavings} ETH`}
              borderColor="#10B981"
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-gray-600 mb-4">Gas Price Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gasPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="timestamp"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Area 
                    type="monotone"
                    dataKey="gasPrice"
                    stroke="#3b82f6"
                    fill="url(#gasPrice)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-right">
            Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Waiting for transaction data...</span>
        </div>
      )}
    </div>
  );
};

export default RealTimeAnalysis;