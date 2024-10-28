import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../elements/Select';
import { Alert, AlertDescription } from '../elements/Alert';
import { Loader2, AlertCircle } from 'lucide-react';

const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: '1',
    rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL,
    retryAttempts: 3
  },
  polygon: {
    name: 'Polygon',
    chainId: '137',
    rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL,
    retryAttempts: 3
  },
  bsc: {
    name: 'BSC',
    chainId: '56',
    rpcUrl: import.meta.env.VITE_BSC_RPC_URL,
    retryAttempts: 3
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: '42161',
    rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL,
    retryAttempts: 3
  }
};

const GasMetrics = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [gasData, setGasData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const makeRPCRequest = async (network, payload, attempt = 1) => {
    const { rpcUrl, retryAttempts, name } = NETWORKS[network];
    
    if (!rpcUrl) {
      throw new Error(`RPC URL not configured for ${name}`);
    }

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC Error');
      }

      return data;
    } catch (err) {
      if (attempt < retryAttempts) {
        // Exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await sleep(backoffTime);
        return makeRPCRequest(network, payload, attempt + 1);
      }
      throw err;
    }
  };

  const fetchGasData = useCallback(async (network) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch gas price
      const gasPriceData = await makeRPCRequest(network, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_gasPrice',
        params: []
      });

      // Fetch latest block
      const blockData = await makeRPCRequest(network, {
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getBlockByNumber',
        params: ['latest', false]
      });

      const baseFee = blockData.result.baseFeePerGas;
      const gasPrice = parseInt(gasPriceData.result, 16);

      setGasData({
        gasPrice: gasPrice / 1e9,
        baseFee: parseInt(baseFee, 16) / 1e9,
        priorityFee: (gasPrice - parseInt(baseFee, 16)) / 1e9
      });

      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching gas data:', err);
      setError(`Failed to fetch gas data: ${err.message}`);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGasData(selectedNetwork);
    
    // Set up polling with dynamic interval based on error state
    const interval = setInterval(() => {
      fetchGasData(selectedNetwork);
    }, retryCount > 0 ? Math.min(12000 * Math.pow(2, retryCount - 1), 60000) : 12000);

    return () => clearInterval(interval);
  }, [selectedNetwork, fetchGasData, retryCount]);

  const renderMetricCard = (title, value) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <p className="text-xl font-bold">{value.toFixed(2)} Gwei</p>
    </div>
  );

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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {retryCount > 0 && ` (Retry attempt ${retryCount})`}
            </AlertDescription>
          </Alert>
        )}
        
        {loading && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        
        {!loading && gasData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderMetricCard('Base Fee', gasData.baseFee)}
            {renderMetricCard('Priority Fee', gasData.priorityFee)}
            {renderMetricCard('Total Gas Price', gasData.gasPrice)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GasMetrics;