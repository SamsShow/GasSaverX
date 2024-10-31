import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle, Activity, Droplets, Wallet } from 'lucide-react';
import Select from 'react-select';

const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: '1',
    rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL,
    retryAttempts: 3,
    color: '#627EEA'
  },
  polygon: {
    name: 'Polygon',
    chainId: '137',
    rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL,
    retryAttempts: 3,
    color: '#8247E5'
  },
  bsc: {
    name: 'BSC',
    chainId: '56',
    rpcUrl: import.meta.env.VITE_BSC_RPC_URL,
    retryAttempts: 3,
    color: '#F3BA2F'
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: '42161',
    rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL,
    retryAttempts: 3,
    color: '#28A0F0'
  }
};

const GasMetrics = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [gasData, setGasData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [historicalData, setHistoricalData] = useState([]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const makeRPCRequest = async (network, payload, attempt = 1) => {
    const { rpcUrl, retryAttempts, name } = NETWORKS[network];
    
    if (!rpcUrl) {
      throw new Error(`RPC URL not configured for ${name}`);
    }

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC Error');
      }

      return data;
    } catch (err) {
      if (attempt < retryAttempts) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await sleep(backoffTime);
        return makeRPCRequest(network, payload, attempt + 1);
      }
      throw err;
    }
  };

  const fetchGasData = useCallback(async (network) => {
    setLoading(true);
    setError(null);

    try {
      const gasPriceData = await makeRPCRequest(network, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_gasPrice',
        params: []
      });

      const blockData = await makeRPCRequest(network, {
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getBlockByNumber',
        params: ['latest', false]
      });

      const baseFee = blockData.result.baseFeePerGas;
      const gasPrice = parseInt(gasPriceData.result, 16);

      const newData = {
        gasPrice: gasPrice / 1e9,
        baseFee: parseInt(baseFee, 16) / 1e9,
        priorityFee: (gasPrice - parseInt(baseFee, 16)) / 1e9,
        timestamp: new Date().getTime()
      };

      setGasData(newData);
      setHistoricalData(prev => [...prev.slice(-11), newData].sort((a, b) => a.timestamp - b.timestamp));
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching gas data:', err);
      setError(`Failed to fetch gas data: ${err.message}`);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGasData(selectedNetwork);
    
    const interval = setInterval(() => {
      fetchGasData(selectedNetwork);
    }, retryCount > 0 ? Math.min(12000 * Math.pow(2, retryCount - 1), 60000) : 12000);

    return () => clearInterval(interval);
  }, [selectedNetwork, fetchGasData, retryCount]);

  const selectOptions = Object.entries(NETWORKS).map(([key, network]) => ({
    value: key,
    label: (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: network.color }} />
        {network.name}
      </div>
    )
  }));

  const renderMetricCard = (title, value, icon, color) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
      whileHover={{ scale: 1.02 }}
      style={{ border: `1px solid ${color}20` }}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-gray-600 font-medium">{title}</h3>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>
        {value.toFixed(2)} <span className="text-lg font-normal text-gray-500">Gwei</span>
      </p>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl mx-auto p-6 space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <motion.h1 
          className="text-2xl font-bold text-gray-800"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
        >
          Gas Metrics
        </motion.h1>
        <Select
          value={selectOptions.find(option => option.value === selectedNetwork)}
          onChange={(option) => setSelectedNetwork(option.value)}
          options={selectOptions}
          className="w-[200px]"
          classNamePrefix="react-select"
          isSearchable={false}
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: NETWORKS[selectedNetwork].color,
            },
          })}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700"
          >
            <AlertCircle className="h-5 w-5" />
            <p>
              {error}
              {retryCount > 0 && ` (Retry attempt ${retryCount})`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && !gasData && (
        <motion.div 
          className="flex items-center justify-center p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </motion.div>
      )}

      {gasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderMetricCard('Base Fee', gasData.baseFee, 
              <Activity className="h-6 w-6" style={{ color: NETWORKS[selectedNetwork].color }} />, 
              NETWORKS[selectedNetwork].color
            )}
            {renderMetricCard('Priority Fee', gasData.priorityFee,
              <Droplets className="h-6 w-6" style={{ color: NETWORKS[selectedNetwork].color }} />,
              NETWORKS[selectedNetwork].color
            )}
            {renderMetricCard('Total Gas Price', gasData.gasPrice,
              <Wallet className="h-6 w-6" style={{ color: NETWORKS[selectedNetwork].color }} />,
              NETWORKS[selectedNetwork].color
            )}
          </div>

          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Historical Gas Prices</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} 
                    stroke="#94a3b8"
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: `1px solid ${NETWORKS[selectedNetwork].color}20` 
                    }}
                    labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gasPrice" 
                    stroke={NETWORKS[selectedNetwork].color} 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default GasMetrics;