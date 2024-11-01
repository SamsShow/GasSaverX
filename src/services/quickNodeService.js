import { ethers } from 'ethers';

class QuickNodeService {
  constructor() {
    const apiKey = import.meta.env.VITE_QUICKNODE_API_KEY;
    if (!apiKey) {
      throw new Error('QuickNode API key is not configured');
    }

    
    const wssUrl = import.meta.env.VITE_QUICKNODE_WSS_ENDPOINT;
    const httpUrl = wssUrl.replace('wss://', 'https://');

   
    this.config = {
      url: httpUrl,
      apiKey,
      wsUrl: wssUrl
    };

    
    this.wsProvider = new ethers.WebSocketProvider(this.config.wsUrl, undefined, {
      headers: { 'x-api-key': apiKey }
    });

    this.httpProvider = new ethers.JsonRpcProvider(this.config.url, undefined, {
      headers: { 'x-api-key': apiKey }
    });
    
    
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

    
    this.cachedGasInfo = null;
    this.cacheExpiration = 10 * 1000;
    this.lastFetchTime = 0;
  }

  async makeAuthenticatedRequest(method, params = []) {
    try {
      const result = await this.httpProvider.send(method, params);
      return result;
    } catch (error) {
      console.error(`Failed to make authenticated request to ${method}:`, error);
      throw error;
    }
  }

  async getMaxPriorityFeePerGas() {
    const now = Date.now();

    
    if (this.cachedGasInfo && (now - this.lastFetchTime) < this.cacheExpiration) {
      return this.cachedGasInfo;
    }

    for (let i = 0; i < 3; i++) {
      try {
        const maxPriorityFeePerGas = await this.makeAuthenticatedRequest('eth_maxPriorityFeePerGas');
        this.cachedGasInfo = parseInt(maxPriorityFeePerGas, 16) / 1e9;
        this.lastFetchTime = now;
        return this.cachedGasInfo;
      } catch (error) {
        if (i === 2 || error.code !== -32007) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); 
      }
    }
  }

  async analyzeTransaction(transactionData, network = 'ethereum') {
    try {
      if (!transactionData || typeof transactionData !== 'object') {
        throw new Error('Invalid transaction data');
      }

      
      let gasPrice;
      try {
        gasPrice = transactionData.gasPrice || transactionData.maxFeePerGas || await this.makeAuthenticatedRequest('eth_gasPrice');
      } catch (error) {
        console.warn('Failed to get gas price, using default:', error);
        gasPrice = '0x' + (50n * 1000000000n).toString(16); // Default 50 Gwei
      }

      const gasLimit = transactionData.gasLimit || transactionData.gas || '0x5208'; // Default to 21000 gas
      const baseFeePerGas = await this.getBaseFeePerGas(); 
      const maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas(); 

      const gasPriceGwei = parseInt(gasPrice, 16) / 1e9;
      const gasLimitValue = parseInt(gasLimit, 16);

      const currentThresholds = this.thresholds[network] || this.thresholds.ethereum;

      const analysis = {
        timestamp: Date.now(),
        network,
        transaction: {
          ...transactionData,
          gasPrice: gasPriceGwei.toString(),
          gasLimit: gasLimitValue.toString()
        },
        gasAnalysis: {
          currentGasPrice: gasPriceGwei,
          baseFeePerGas,
          maxPriorityFeePerGas,
          priceLevel: gasPriceGwei <= currentThresholds.low ? 'low' :
                     gasPriceGwei <= currentThresholds.medium ? 'medium' : 'high',
          estimatedCost: (gasPriceGwei * gasLimitValue) / 1e9
        },
        suggestions: []
      };

      if (gasPriceGwei > currentThresholds.high) {
        analysis.suggestions.push({
          type: 'delay',
          message: 'Gas prices are high. Consider delaying non-urgent transactions.',
          severity: 'high'
        });
      }

      // EIP-1559 optimization
      if (baseFeePerGas) {
        const potentialBaseFee = Math.min(baseFeePerGas * 1.125, baseFeePerGas + 2);
        const potentialPriorityFee = Math.min(maxPriorityFeePerGas * 0.9, maxPriorityFeePerGas);
        const potentialTotalFee = potentialBaseFee + potentialPriorityFee;

        if (gasPriceGwei > potentialTotalFee) {
          analysis.suggestions.push({
            type: 'eip1559',
            message: `Consider using EIP-1559 with base fee of ${potentialBaseFee.toFixed(2)} Gwei and priority fee of ${potentialPriorityFee.toFixed(2)} Gwei`,
            severity: 'medium'
          });
          analysis.gasAnalysis.potentialSavings = {
            gwei: gasPriceGwei - potentialTotalFee,
            eth: ((gasPriceGwei - potentialTotalFee) * gasLimitValue) / 1e9
          };
        }
      }

      return analysis;
    } catch (error) {
      console.error('Analysis Error:', error);
      throw new Error(`Failed to analyze transaction: ${error.message}`);
    }
  }

  async getBaseFeePerGas() {
    
    for (let i = 0; i < 3; i++) {
      try {
        const block = await this.makeAuthenticatedRequest('eth_getBlockByNumber', ['latest', false]);
        return block?.baseFeePerGas ? parseInt(block.baseFeePerGas, 16) / 1e9 : null;
      } catch (error) {
        if (i === 2) throw error; // Stop retrying after 3 attempts
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }

  async batchAnalyze(transactions, network = 'ethereum') {
    try {
      const analysisPromises = transactions.map(tx => this.analyzeTransaction(tx, network));
      return await Promise.all(analysisPromises);
    } catch (error) {
      console.error('Batch Analysis Error:', error);
      throw new Error('Failed to analyze transactions batch');
    }
  }
}

export const quickNodeService = new QuickNodeService();
