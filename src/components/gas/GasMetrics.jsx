import React, { useState, useEffect } from 'react';
import { useEthereum } from '../../context/EthereumContext';

export default function GasMetrics() {
  const { contract } = useEthereum();
  const [metrics, setMetrics] = useState(null);

  async function fetchGasMetrics() {
    try {
      const stats = await contract.getGasStatistics();
      setMetrics({
        avgGasPrice: stats[0],
        lowestPrice: stats[1],
        highestPrice: stats[2],
        currentPrice: stats[3]
      });
    } catch (error) {
      console.error('Error fetching gas metrics:', error);
    }
  }

  useEffect(() => {
    if (contract) {
      fetchGasMetrics();
      const interval = setInterval(fetchGasMetrics, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [contract]);

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <p className="text-xl font-bold">
            {ethers.formatUnits(value, 'gwei')} Gwei
          </p>
        </div>
      ))}
    </div>
  );
}