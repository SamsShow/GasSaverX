import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';
import { useEthereum } from '../../context/EthereumContext';

const OptimizeGas = () => {
  const { provider, account } = useEthereum();
  
  const [currentGasPrice, setCurrentGasPrice] = useState(null);
  const [optimizedPrice, setOptimizedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savings, setSavings] = useState(null);

  // Fetch gas prices when provider is available
  useEffect(() => {
    if (provider && account) {
      fetchGasPrices();
    }
  }, [provider, account]);

  const fetchGasPrices = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current gas price from the network
      const feeData = await provider.getFeeData();
      const currentPrice = Number(feeData.gasPrice);

      // Get historical gas prices for optimization
      // We'll calculate an optimized price based on recent blocks
      const blockNumber = await provider.getBlockNumber();
      const blocks = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          provider.getBlock(blockNumber - i)
        )
      );

      // Calculate average gas price from recent blocks
      const validBlocks = blocks.filter(block => block && block.baseFeePerGas);
      const avgBaseFee = validBlocks.reduce((sum, block) => 
        sum + Number(block.baseFeePerGas), 0
      ) / validBlocks.length;

      // Add a small priority fee for faster confirmation
      const priorityFee = Number(feeData.maxPriorityFeePerGas) || BigInt(1000000000); // 1 gwei default
      const optimizedGasPrice = avgBaseFee + Number(priorityFee);

      setCurrentGasPrice(currentPrice);
      setOptimizedPrice(optimizedGasPrice);

      // Calculate potential savings
      const potentialSavings = currentPrice - optimizedGasPrice;
      setSavings(potentialSavings > 0 ? potentialSavings : 0);

    } catch (err) {
      console.error('Error fetching gas prices:', err);
      setError('Failed to fetch gas prices. Please ensure you are connected to the network.');
    } finally {
      setLoading(false);
    }
  };

  const formatGwei = (wei) => {
    if (!wei && wei !== 0) return '-';
    return `${(Number(wei) / 1e9).toFixed(2)} Gwei`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Gas Optimization</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Current Network Gas Price</p>
                <p className="text-2xl font-bold">
                  {formatGwei(currentGasPrice)}
                </p>
              </div>

              <ArrowDownCircle className="text-blue-500 h-8 w-8" />

              <div className="w-full p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-600">Optimized Gas Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatGwei(optimizedPrice)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Based on recent block history
                </p>
              </div>
            </div>

            {savings > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-gray-600">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatGwei(savings)} per transaction
                </p>
              </div>
            )}

            <button
              onClick={fetchGasPrices}
              disabled={!provider || !account}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Refresh Gas Prices
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OptimizeGas;