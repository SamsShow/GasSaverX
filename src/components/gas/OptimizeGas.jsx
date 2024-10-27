import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';

const OptimizeGas = ({ contract, account }) => {
  const [gasPrice, setGasPrice] = useState(null);
  const [optimizedPrice, setOptimizedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savings, setSavings] = useState(null);

  useEffect(() => {
    if (contract) {
      fetchGasMetrics();
    }
  }, [contract]);

  const fetchGasMetrics = async () => {
    try {
      setLoading(true);
      const stats = await contract.getGasStatistics();
      setGasPrice(stats.currentPrice);
      setOptimizedPrice(stats.avgGasPrice);
      
      // Calculate potential savings
      const potentialSavings = Number(stats.currentPrice) - Number(stats.avgGasPrice);
      setSavings(potentialSavings > 0 ? potentialSavings : 0);
      
      setError('');
    } catch (err) {
      setError('Failed to fetch gas metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
                <p className="text-gray-600">Current Gas Price</p>
                <p className="text-2xl font-bold">
                  {gasPrice ? `${(Number(gasPrice) / 1e9).toFixed(2)} Gwei` : '-'}
                </p>
              </div>

              <ArrowDownCircle className="text-blue-500 h-8 w-8" />

              <div className="w-full p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-600">Optimized Gas Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  {optimizedPrice ? `${(Number(optimizedPrice) / 1e9).toFixed(2)} Gwei` : '-'}
                </p>
              </div>
            </div>

            {savings > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-gray-600">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {`${(savings / 1e9).toFixed(2)} Gwei per transaction`}
                </p>
              </div>
            )}

            <button
              onClick={fetchGasMetrics}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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