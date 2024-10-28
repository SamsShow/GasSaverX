import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';
import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';
import { RefreshCw, AlertCircle, Activity } from 'lucide-react';

const RealTimeAnalysis = () => {
  const [streamData, setStreamData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let cleanup;

    const connect = async () => {
      try {
        if (!import.meta.env.VITE_QUICKNODE_WSS_ENDPOINT) {
          throw new Error('QuickNode WSS endpoint not configured');
        }

        // Simulate some initial data while waiting for real connections
        setStreamData([
          {
            hash: '0x1234...',
            gasPrice: '50000000000',
            gasLimit: '21000',
            timestamp: Date.now(),
            optimization: { suggestions: ['Consider using EIP-1559'] },
            gasAnalysis: { potentialSavings: { eth: 0.002 } }
          }
        ]);

        setIsConnected(true);
        setError(null);
        setLastUpdate(Date.now());

        // Simulate periodic updates
        const interval = setInterval(() => {
          setStreamData(prev => {
            const newTx = {
              hash: `0x${Math.random().toString(16).slice(2)}`,
              gasPrice: Math.floor(40 + Math.random() * 20) + '000000000', // Whole number gas prices
              gasLimit: '21000',
              timestamp: Date.now(),
              optimization: {
                suggestions: Math.random() > 0.5 ? ['Consider using EIP-1559'] : []
              },
              gasAnalysis: {
                potentialSavings: { eth: Math.random() * 0.005 }
              }
            };
            return [newTx, ...prev].slice(0, 100);
          });
          setLastUpdate(Date.now());
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

    return () => {
      cleanup?.();
    };
  }, []);

  const analytics = useMemo(() => {
    if (!streamData.length) return null;

    const calculateAvgGasPrice = () => {
      const sum = streamData.reduce((acc, tx) => {
        // Convert gas price to number, handling both string and number formats
        const priceInGwei = typeof tx.gasPrice === 'string' 
          ? Number(tx.gasPrice) / 1e9  // Convert wei to gwei
          : Number(tx.gasPrice);       // Already in gwei
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Transaction Analysis
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="text-sm font-medium text-gray-500">Average Gas Price</h3>
                <p className="text-2xl font-bold">{analytics.avgGasPrice} Gwei</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="text-sm font-medium text-gray-500">Transactions Analyzed</h3>
                <p className="text-2xl font-bold">{analytics.totalTransactions}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="text-sm font-medium text-gray-500">Optimizable Transactions</h3>
                <p className="text-2xl font-bold">{analytics.optimizableTransactions}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="text-sm font-medium text-gray-500">Potential ETH Savings</h3>
                <p className="text-2xl font-bold">{analytics.potentialSavings} ETH</p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-right">
              Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Waiting for transaction data...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeAnalysis;