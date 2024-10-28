// src/services/quickNodeService.js
import { ethers } from 'ethers';

class QuickNodeService {
  constructor() {
    this.wsProvider = new ethers.WebSocketProvider(
      import.meta.env.VITE_QUICKNODE_WSS_ENDPOINT
    );
    this.httpProvider = new ethers.JsonRpcProvider(
      import.meta.env.VITE_QUICKNODE_RPC_URL
    );
    
    // Network-specific gas thresholds (in Gwei)
    this.thresholds = {
      ethereum: {
        low: 20,
        medium: 40,
        high: 60
      },
      polygon: {
        low: 50,
        medium: 100,
        high: 200
      },
      arbitrum: {
        low: 0.1,
        medium: 0.3,
        high: 0.5
      }
    };
  }

  async analyzeTransaction(transactionData, network = 'ethereum') {
    try {
      // Get current network conditions
      const [baseFeePerGas, maxPriorityFeePerGas] = await Promise.all([
        this.httpProvider.send('eth_getBlockByNumber', ['latest', false])
          .then(block => parseInt(block.baseFeePerGas, 16) / 1e9),
        this.httpProvider.send('eth_maxPriorityFeePerGas', [])
          .then(fee => parseInt(fee, 16) / 1e9)
      ]);

      const gasPrice = parseInt(transactionData.gasPrice) / 1e9;
      const gasLimit = parseInt(transactionData.gasLimit);
      const currentThresholds = this.thresholds[network] || this.thresholds.ethereum;

      // Analysis structure
      const analysis = {
        timestamp: Date.now(),
        network,
        transaction: transactionData,
        gasAnalysis: {
          currentGasPrice: gasPrice,
          baseFeePerGas,
          maxPriorityFeePerGas,
          priceLevel: gasPrice <= currentThresholds.low ? 'low' :
                      gasPrice <= currentThresholds.medium ? 'medium' : 'high',
          estimatedCost: (gasPrice * gasLimit) / 1e9
        },
        suggestions: []
      };

      // Generate optimization suggestions
      if (gasPrice > currentThresholds.high) {
        analysis.suggestions.push({
          type: 'delay',
          message: 'Gas prices are high. Consider delaying non-urgent transactions.',
          severity: 'high'
        });
      }

      // Check if EIP-1559 optimization is possible
      const potentialBaseFee = Math.min(baseFeePerGas * 1.125, baseFeePerGas + 2);
      const potentialPriorityFee = Math.min(maxPriorityFeePerGas * 0.9, maxPriorityFeePerGas);
      const potentialTotalFee = potentialBaseFee + potentialPriorityFee;

      if (gasPrice > potentialTotalFee) {
        analysis.suggestions.push({
          type: 'eip1559',
          message: `Consider using EIP-1559 with base fee of ${potentialBaseFee.toFixed(2)} Gwei and priority fee of ${potentialPriorityFee.toFixed(2)} Gwei`,
          severity: 'medium'
        });
      }

      // Calculate potential savings
      if (analysis.suggestions.length > 0) {
        const potentialGasPrice = Math.min(gasPrice, potentialTotalFee);
        analysis.gasAnalysis.potentialSavings = {
          gwei: gasPrice - potentialGasPrice,
          eth: ((gasPrice - potentialGasPrice) * gasLimit) / 1e9
        };
      }

      // Add historical context
      const historicalAnalysis = await this.getHistoricalGasAnalysis();
      analysis.gasAnalysis.historical = historicalAnalysis;

      return analysis;
    } catch (error) {
      console.error('Analysis Error:', error);
      throw new Error('Failed to analyze transaction');
    }
  }

  async getHistoricalGasAnalysis() {
    try {
      // Get the last 10 blocks for historical analysis
      const latestBlock = await this.httpProvider.getBlockNumber();
      const blockPromises = [];
      
      for (let i = 0; i < 10; i++) {
        blockPromises.push(
          this.httpProvider.getBlock(latestBlock - i)
        );
      }

      const blocks = await Promise.all(blockPromises);
      
      // Calculate average gas prices from historical blocks
      const gasStats = blocks.reduce((stats, block) => {
        if (block.baseFeePerGas) {
          const baseFee = Number(block.baseFeePerGas) / 1e9;
          stats.sum += baseFee;
          stats.min = Math.min(stats.min, baseFee);
          stats.max = Math.max(stats.max, baseFee);
        }
        return stats;
      }, { sum: 0, min: Infinity, max: -Infinity });

      return {
        avgBaseFee: gasStats.sum / blocks.length,
        minBaseFee: gasStats.min,
        maxBaseFee: gasStats.max,
        timeWindow: '10 blocks'
      };
    } catch (error) {
      console.error('Historical Analysis Error:', error);
      return null;
    }
  }

  async batchAnalyze(transactions, network = 'ethereum') {
    try {
      const analysisPromises = transactions.map(tx => 
        this.analyzeTransaction(tx, network)
      );
      return await Promise.all(analysisPromises);
    } catch (error) {
      console.error('Batch Analysis Error:', error);
      throw new Error('Failed to analyze transactions batch');
    }
  }
}

export const quickNodeService = new QuickNodeService();