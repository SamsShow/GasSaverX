import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import contractABI from '../config/abi.json';
import { CONTRACT_ADDRESS } from '../config/contractAddress';
import { formatGasPrice, formatEther, parseEther } from '../utils/helpers';

export const useGasSaver = (signer, provider) => {
  const [isLoading, setIsLoading] = useState(false);
  const [gasMetrics, setGasMetrics] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [optimizedGasPrice, setOptimizedGasPrice] = useState(null);
  const [error, setError] = useState(null);
  
  const getContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  }, [signer]);

  // Get gas statistics
  const getGasStatistics = async () => {
    const contract = getContract();
    if (!contract) return;

    try {
      const stats = await contract.getGasStatistics();
      return {
        averageGasPrice: formatGasPrice(stats.avgGasPrice),
        lowestPrice: formatGasPrice(stats.lowestPrice),
        highestPrice: formatGasPrice(stats.highestPrice),
        currentPrice: formatGasPrice(stats.currentPrice)
      };
    } catch (err) {
      console.error('Failed to fetch gas statistics:', err);
      throw err;
    }
  };

  
  const estimateGasCost = async (to, data, value) => {
    const contract = getContract();
    if (!contract) return;

    setIsLoading(true);
    try {
      
      const gasLimit = await provider.estimateGas({
        to,
        data,
        value: parseEther(value || '0')
      });

      
      const [optimizedPrice, costEstimate] = await contract.optimizeGasUsage(
        to,
        data,
        gasLimit
      );

      setOptimizedGasPrice(formatGasPrice(optimizedPrice));
      setEstimatedCost(formatEther(costEstimate));

      return {
        gasLimit,
        optimizedPrice: formatGasPrice(optimizedPrice),
        estimatedCost: formatEther(costEstimate)
      };
    } catch (err) {
      console.error('Failed to estimate gas cost:', err);
      toast.error('Failed to estimate gas cost');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  
  const executeTransaction = async (to, data, value) => {
    const contract = getContract();
    if (!contract) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.executeOptimizedTransaction(
        to,
        data,
        parseEther(value || '0'),
        {
          value: estimatedCost ? parseEther(estimatedCost) : 0
        }
      );

      toast.info('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      
      const newMetrics = await getGasStatistics();
      setGasMetrics(newMetrics);

      toast.success('Transaction completed successfully!');
      return tx;
    } catch (err) {
      console.error('Transaction failed:', err);
      toast.error('Transaction failed: ' + (err.reason || err.message));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  
  const getPyusdCostEstimate = async (gasLimit) => {
    const contract = getContract();
    if (!contract) return;

    try {
      const pyusdCost = await contract.estimateGasCostInPyusd(gasLimit);
      return formatEther(pyusdCost);
    } catch (err) {
      console.error('Failed to estimate PYUSD cost:', err);
      throw err;
    }
  };

 
  const updatePriceData = async () => {
    const contract = getContract();
    if (!contract) return;

    try {
      const tx = await contract.updatePriceData();
      await tx.wait();
      toast.success('Price data updated successfully');
    } catch (err) {
      console.error('Failed to update price data:', err);
      toast.error('Failed to update price data');
      throw err;
    }
  };

  const getTransactionHistory = useCallback(async () => {
    try {
      
      return [
        {
          hash: '0x1234...5678',
          from: '0xabcd...efgh',
          to: '0xijkl...mnop',
          value: '1000000000000000000', // 1 ETH
          gasSaved: '21000',
          status: 'success',
          timestamp: Date.now()
        }
        
      ];
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return {
    isLoading,
    gasMetrics,
    estimatedCost,
    optimizedGasPrice,
    getGasStatistics,
    estimateGasCost,
    executeTransaction,
    getPyusdCostEstimate,
    updatePriceData,
    getTransactionHistory,
    error
  };
};

export default useGasSaver;