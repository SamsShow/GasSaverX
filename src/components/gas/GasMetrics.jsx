import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../elements/Select';
import { Loader2 } from 'lucide-react';

const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: '1',
    rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL
  },
  polygon: {
    name: 'Polygon',
    chainId: '137',
    rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL
  },
  bsc: {
    name: 'BSC',
    chainId: '56',
    rpcUrl: import.meta.env.VITE_BSC_RPC_URL
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: '42161',
    rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL
  }
};

const GasMetrics = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [gasData, setGasData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGasData = async (network) => {
    if (!NETWORKS[network].rpcUrl) {
      setError(`RPC URL not configured for ${NETWORKS[network].name}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(NETWORKS[network].rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_gasPrice',
          params: []
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const baseFeeResponse = await fetch(NETWORKS[network].rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_getBlockByNumber',
          params: ['latest', false]
        })
      });

      const blockData = await baseFeeResponse.json();
      const baseFee = blockData.result.baseFeePerGas;

      setGasData({
        gasPrice: parseInt(data.result, 16) / 1e9,
        baseFee: parseInt(baseFee, 16) / 1e9,
        priorityFee: (parseInt(data.result, 16) - parseInt(baseFee, 16)) / 1e9
      });
    } catch (err) {
      setError('Failed to fetch gas data');
      console.error('Error fetching gas data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasData(selectedNetwork);
    const interval = setInterval(() => {
      fetchGasData(selectedNetwork);
    }, 12000);

    return () => clearInterval(interval);
  }, [selectedNetwork]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Gas Metrics</CardTitle>
        <Select
          value={selectedNetwork}
          onValueChange={setSelectedNetwork}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(NETWORKS).map(([key, network]) => (
              <SelectItem key={key} value={key}>
                {network.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : gasData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Base Fee</h3>
              <p className="text-xl font-bold">{gasData.baseFee.toFixed(2)} Gwei</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Priority Fee</h3>
              <p className="text-xl font-bold">{gasData.priorityFee.toFixed(2)} Gwei</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Total Gas Price</h3>
              <p className="text-xl font-bold">{gasData.gasPrice.toFixed(2)} Gwei</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default GasMetrics;