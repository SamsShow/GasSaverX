import React, { useMemo } from 'react';
import { useQuickNode } from '../../hooks/useQuickNode';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';
import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';

export default function RealTimeAnalysis() {
  const { streamData, isConnected, error } = useQuickNode();

  // Calculate average gas prices from stream data
  const analytics = useMemo(() => {
    if (!streamData.length) return null;

    const gasPrices = streamData.map(tx => BigInt(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((a, b) => a + b, 0n) / BigInt(gasPrices.length);
    
    return {
      avgGasPrice: (Number(avgGasPrice) / 1e9).toFixed(2),
      totalTransactions: streamData.length,
      optimizableTransactions: streamData.filter(tx => 
        tx.optimization?.suggestions?.length > 0
      ).length
    };
  }, [streamData]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Real-time Transaction Analysis
          <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Average Gas Price</h3>
              <p className="text-2xl font-bold">{analytics.avgGasPrice} Gwei</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Transactions Analyzed</h3>
              <p className="text-2xl font-bold">{analytics.totalTransactions}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Optimizable Transactions</h3>
              <p className="text-2xl font-bold">{analytics.optimizableTransactions}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">Waiting for transaction data...</div>
        )}
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {streamData.slice(0, 5).map((tx) => (
              <div key={tx.hash} className="p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">TX: {tx.hash.slice(0, 10)}...</p>
                    <p className="text-sm text-gray-500">
                      Gas Price: {(Number(tx.gasPrice) / 1e9).toFixed(2)} Gwei
                    </p>
                  </div>
                  {tx.optimization?.suggestions?.length > 0 && (
                    <div className="text-sm text-green-600">
                      Optimization Available
                    </div>
                  )}
                </div>
                {tx.optimization?.suggestions?.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">Suggestions:</p>
                    <ul className="list-disc list-inside">
                      {tx.optimization.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}