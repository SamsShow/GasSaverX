import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { quickNodeService } from '../services/quickNodeService';

export function useQuickNode() {
  const [streamData, setStreamData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connectToStream = useCallback(async () => {
    try {
      const provider = new ethers.WebSocketProvider(
        import.meta.env.VITE_QUICKNODE_WSS_ENDPOINT
      );

      provider.on('pending', async (txHash) => {
        try {
          const tx = await provider.getTransaction(txHash);
          if (!tx) return; // Skip if transaction not found

          // Create a normalized transaction object
          const txData = {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            gasPrice: tx.gasPrice?.toString() || tx.maxFeePerGas?.toString(),
            gasLimit: tx.gasLimit?.toString(),
            value: tx.value?.toString(),
            data: tx.data,
            timestamp: Date.now()
          };

          // Analyze the transaction
          try {
            const analysis = await quickNodeService.analyzeTransaction(txData);
            
            // Format the transaction data with analysis results
            const formattedTx = {
              ...txData,
              optimization: {
                suggestions: analysis.suggestions.map(s => s.message)
              },
              gasAnalysis: analysis.gasAnalysis
            };

            setStreamData((prevData) => {
              const updatedData = [formattedTx, ...prevData].slice(0, 100);
              return updatedData;
            });
          } catch (analysisError) {
            console.warn('Transaction analysis failed:', analysisError);
            // Still add the transaction to stream data even if analysis fails
            setStreamData((prevData) => {
              const updatedData = [txData, ...prevData].slice(0, 100);
              return updatedData;
            });
          }
        } catch (txError) {
          console.error('Error processing transaction:', txError);
        }
      });

      provider._websocket.on('open', () => {
        setIsConnected(true);
        setError(null);
      });

      provider._websocket.on('close', () => {
        setIsConnected(false);
        setError('WebSocket connection closed');
      });

      provider._websocket.on('error', (err) => {
        setError(`WebSocket error: ${err.message}`);
        setIsConnected(false);
      });

      return () => {
        provider.removeAllListeners();
        provider._websocket.close();
      };
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    const cleanup = connectToStream();
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [connectToStream]);

  return {
    streamData,
    isConnected,
    error
  };
}