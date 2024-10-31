import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownCircle, AlertCircle, RefreshCw, Activity, Server, Wallet, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RealTimeAnalysis from '../gas/RealTimeAnalysis';

const OptimizeGas = () => {
  const [currentGasPrice, setCurrentGasPrice] = useState(null);
  const [optimizedPrice, setOptimizedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savings, setSavings] = useState(null);
  const [commonTokens, setCommonTokens] = useState([]);
  const [selectedOutputToken, setSelectedOutputToken] = useState(null);
  const [networkDetails, setNetworkDetails] = useState(null);
  const [currentChainId, setCurrentChainId] = useState(null);
  const [lastQuoteTimestamp, setLastQuoteTimestamp] = useState(null);
  const [quoteDetails, setQuoteDetails] = useState(null);
  const [gasPriceHistory, setGasPriceHistory] = useState([]);

  useEffect(() => {
    if (currentGasPrice) {
      setGasPriceHistory(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        price: Number(currentGasPrice) / 1e9
      }].slice(-10));
    }
  }, [currentGasPrice]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  useEffect(() => {
    const initializeNetwork = async () => {
      if (!window.ethereum) {
        setError('MetaMask or compatible wallet not detected');
        return;
      }

      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const parsedChainId = parseInt(chainId, 16);
        setCurrentChainId(parsedChainId);

        const networkNames = {
          1: 'Ethereum Mainnet',
          137: 'Polygon',
          42161: 'Arbitrum One',
          10: 'Optimism'
        };

        setNetworkDetails({ name: networkNames[parsedChainId] || 'Unknown Network' });

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];

        const supportedChains = [1, 137, 42161, 10];
        if (supportedChains.includes(parsedChainId)) {
          await fetchChainTokens(parsedChainId);
        } else {
          setError(`Chain ID ${parsedChainId} is not supported. Please switch to a supported network.`);
        }
      } catch (err) {
        console.error('Error initializing network:', err);
        setError(`Network initialization error: ${err.message}`);
      }
    };

    initializeNetwork();
  }, []);

  const fetchChainTokens = async (chainId) => {
    try {
      setLoading(true);

      const defaultTokens = {
        1: [
          { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
          { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
          { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 }
        ],
        137: [
          { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
          { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 }
        ]
      };

      setCommonTokens(defaultTokens[chainId] || []);
      const defaultToken = defaultTokens[chainId]?.find(t => t.symbol === 'USDC') || defaultTokens[chainId]?.[0];
      setSelectedOutputToken(defaultToken);

    } catch (err) {
      setError(`Token initialization error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        if (response.ok) {
          return responseData;
        }
        
        if (i === retries - 1) {
          throw new Error(JSON.stringify(responseData));
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const validateQuoteResponse = (quote) => {
    if (!quote) throw new Error('Empty quote response');
    
    const requiredFields = ['gweiPerGas', 'gasEstimate', 'outAmounts', 'pathId'];
    const missingFields = requiredFields.filter(field => !quote.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in quote: ${missingFields.join(', ')}`);
    }
    
    return true;
  };

  const fetchOptimizedQuote = async () => {
    if (!currentChainId || !selectedOutputToken) {
      setError('Missing required information: chain ID or output token');
      return;
    }

    if (lastQuoteTimestamp && Date.now() - lastQuoteTimestamp < 2000) {
      setError('Please wait a few seconds between quote requests');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setLastQuoteTimestamp(Date.now());
      setQuoteDetails(null);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      const userAddress = accounts[0];
      
      if (!userAddress) {
        throw new Error('No wallet address available');
      }

      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });
      const currentPrice = parseInt(gasPrice, 16);
      setCurrentGasPrice(currentPrice);
      
      const inputAmount = '1000000000000000000'; // 1 ETH

      const quoteRequestBody = {
        chainId: currentChainId,
        inputTokens: [
          {
            tokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            amount: inputAmount
          }
        ],
        outputTokens: [
          {
            tokenAddress: selectedOutputToken.address,
            proportion: 1
          }
        ],
        userAddr: userAddress,
        slippageLimitPercent: 0.3,
        referralCode: 0,
        disableRFQs: false,
        compact: true
      };

      const quote = await fetchWithRetry(
        'https://api.odos.xyz/sor/quote/v2',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(quoteRequestBody)
        }
      );

      validateQuoteResponse(quote);

      const optimizedGasPrice = parseFloat(quote.gweiPerGas) * 1e9;
      setOptimizedPrice(optimizedGasPrice);
      setQuoteDetails({
        gasEstimate: quote.gasEstimate,
        outputAmount: quote.outAmounts[0],
        pathId: quote.pathId
      });

      const potentialSavings = currentPrice - optimizedGasPrice;
      setSavings(potentialSavings > 0 ? potentialSavings : 0);

    } catch (err) {
      console.error('Error fetching optimized quote:', err);
      setError(`Optimization error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatGwei = (wei) => {
    if (!wei && wei !== 0) return '-';
    return `${(Number(wei) / 1e9).toFixed(2)} Gwei`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6"
    >
      <motion.div 
        className="max-w-4xl mx-auto bg-white rounded-md shadow-xl overflow-hidden"
        variants={itemVariants}
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 text-white">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Gas & Route Optimization
          </h1>
          <p className="mt-2 opacity-90">Optimize your transaction costs and routing efficiency</p>
        </div>

        <div className="p-6">
          {/* Real-Time Analysis Section */}
          <motion.div
            variants={itemVariants}
            className="mb-6 bg-white rounded-xl shadow-md p-4 border border-gray-100"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Real-Time Analysis
            </h3>
            <RealTimeAnalysis />
          </motion.div>

          {/* Network Status Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <Server className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-lg">Network Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Chain ID</p>
                <p className="font-semibold">{currentChainId || 'Not detected'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Network</p>
                <p className="font-semibold">{networkDetails?.name || 'Unknown'}</p>
              </div>
            </div>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Token Selection */}
          {commonTokens.length > 0 && (
            <motion.div variants={itemVariants} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Output Token
              </label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={selectedOutputToken?.address || ''}
                onChange={(e) => {
                  const token = commonTokens.find(t => t.address === e.target.value);
                  setSelectedOutputToken(token);
                }}
              >
                {commonTokens.map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Gas Price Chart */}
          <motion.div
            variants={itemVariants}
            className="mb-6 bg-white rounded-xl shadow-md p-4 border border-gray-100"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Gas Price History
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gasPriceHistory}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ fill: '#4F46E5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={itemVariants} className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Gas Price */}
                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md"
                >
                  <p className="text-blue-700 font-medium mb-2">Current Gas Price</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatGwei(currentGasPrice)}
                  </p>
                </motion.div>

                {/* Optimized Gas Price */}
                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md"
                >
                  <p className="text-purple-700 font-medium mb-2">Optimized Gas Price</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {formatGwei(optimizedPrice)}
                  </p>
                </motion.div>

                {/* Savings Display */}
                {savings > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="md:col-span-2 bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md"
                  >
                    <p className="text-green-700 font-medium mb-2">Potential Savings</p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatGwei(savings)}
                    </p>
                  </motion.div>
                )}

                {/* Quote Details */}
                {quoteDetails && (
                  <motion.div
                    variants={itemVariants}
                    className="md:col-span-2 bg-white border border-gray-200 p-6 rounded-xl shadow-md"
                  >
                    <h4 className="text-lg font-semibold mb-4">Transaction Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Gas Estimate</p>
                        <p className="font-semibold">{quoteDetails.gasEstimate.toLocaleString()} units</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Output Amount</p>
                        <p className="font-semibold">
                          {(quoteDetails.outputAmount / Math.pow(10, selectedOutputToken?.decimals || 6)).toFixed(6)} {selectedOutputToken?.symbol}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Path ID</p>
                        <p className="font-semibold truncate">{quoteDetails.pathId}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* Action Button */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex justify-center"
          >
            <button
              className={`
                px-6 py-3 rounded-xl font-medium text-white
                transform transition-all duration-200
                ${loading || !selectedOutputToken
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 hover:shadow-lg active:scale-95'}
              `}
              onClick={fetchOptimizedQuote}
              disabled={loading || !selectedOutputToken}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Optimizing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Optimize Gas
                </span>
              )}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OptimizeGas;