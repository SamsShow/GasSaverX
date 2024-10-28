import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useQuickNode() {
  const [streamData, setStreamData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Initialize WebSocket connection
  const connectToStream = useCallback(async () => {
    try {
      const provider = new ethers.WebSocketProvider(
        import.meta.env.VITE_QUICKNODE_WSS_ENDPOINT
      );

      provider.on('pending', async (txHash) => {
        try {
          const tx = await provider.getTransaction(txHash);
          if (tx) {
            const txData = {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              gasPrice: tx.gasPrice.toString(),
              gasLimit: tx.gasLimit.toString(),
              timestamp: Date.now(),
              // Add any optimization suggestions if available
              optimization: {
                suggestions: []  // This could be populated based on your optimization logic
              }
            };

            setStreamData((prevData) => {
              const updatedData = [txData, ...prevData].slice(0, 100);
              return updatedData;
            });
          }
        } catch (err) {
          console.error('Error processing transaction:', err);
        }
      });

      setIsConnected(true);
      setError(null);

      return () => {
        provider.removeAllListeners();
      };
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    }
  }, []);

  // Initialize connection on component mount
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