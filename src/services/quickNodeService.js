// src/services/quickNodeService.js
import { ethers } from 'ethers';

export class QuickNodeService {
  constructor(quickNodeEndpoint, quickNodeFunctionEndpoint) {
    this.wsProvider = new ethers.WebSocketProvider(quickNodeEndpoint);
    this.functionEndpoint = quickNodeFunctionEndpoint;
  }

  // Initialize stream subscription
  async subscribeToTransactions(callback) {
    try {
      // Subscribe to pending transactions
      this.wsProvider.on('pending', async (txHash) => {
        const tx = await this.wsProvider.getTransaction(txHash);
        if (tx) {
          // Process transaction data
          const txData = {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            gasPrice: tx.gasPrice.toString(),
            gasLimit: tx.gasLimit.toString(),
            timestamp: Date.now(),
          };
          
          // Get optimization suggestions from QuickNode Function
          const optimization = await this.getOptimizationSuggestions(txData);
          callback({ transaction: txData, optimization });
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error subscribing to transactions:', error);
      throw error;
    }
  }

  // Call QuickNode Function for optimization suggestions
  async getOptimizationSuggestions(txData) {
    try {
      const response = await fetch(this.functionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_QUICKNODE_API_KEY}`
        },
        body: JSON.stringify({
          transaction: txData,
          network: 'ethereum',
          optimizationTarget: 'gas'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get optimization suggestions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting optimization suggestions:', error);
      return null;
    }
  }
}