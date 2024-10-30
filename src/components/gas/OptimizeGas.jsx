import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';
import { motion } from 'framer-motion'
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Gas & Route Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <RealTimeAnalysis />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Network Status</h3>
            <div className="text-sm space-y-1">
              <p>Chain ID: {currentChainId || 'Not detected'}</p>
              {networkDetails && <p>Network: {networkDetails.name}</p>}
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {commonTokens.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Token
              </label>
              <select
                className="w-full p-2 border rounded-md"
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-gray-600">Current Gas Price</p>
                  <p className="text-2xl font-bold">
                    {formatGwei(currentGasPrice)}
                  </p>
                </motion.div>

                <ArrowDownCircle className="text-blue-500 h-8 w-8" />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-gray-600">Optimized Gas Price</p>
                  <p className="text-2xl font-bold">
                    {formatGwei(optimizedPrice)}
                  </p>
                </motion.div>

                {savings > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full p-4 bg-green-50 rounded-lg"
                  >
                    <p className="text-gray-600">Potential Savings</p>
                    <p className="text-2xl font-bold text-green-500">
                      {formatGwei(savings)}
                    </p>
                  </motion.div>
                )}

                {quoteDetails && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full p-4 bg-blue-50 rounded-lg"
                  >
                    <h4 className="font-semibold mb-2">Quote Details</h4>
                    <div className="text-sm space-y-1">
                      <p>Gas Estimate: {quoteDetails.gasEstimate.toLocaleString()} units</p>
                      <p>Output Amount: {(quoteDetails.outputAmount / Math.pow(10, selectedOutputToken?.decimals || 6)).toFixed(6)} {selectedOutputToken?.symbol}</p>
                      <p>Path ID: {quoteDetails.pathId}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 flex justify-end"
          >
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              onClick={fetchOptimizedQuote}
              disabled={loading || !selectedOutputToken}
            >
              {loading ? 'Optimizing...' : 'Optimize Gas'}
            </button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OptimizeGas;