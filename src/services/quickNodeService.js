import { ethers } from 'ethers';

class QuickNodeService {
  constructor() {
    const apiKey = import.meta.env.VITE_QUICKNODE_API_KEY;
    if (!apiKey) {
      throw new Error('QuickNode API key is not configured');
    }

    // Use the WSS endpoint base URL to derive the HTTP endpoint
    // Convert WSS URL to HTTPS for RPC calls
    const wssUrl = import.meta.env.VITE_QUICKNODE_WSS_ENDPOINT;
    const httpUrl = wssUrl.replace('wss://', 'https://');

    // Store connection configuration
    this.config = {
      url: httpUrl,
      apiKey,
      wsUrl: wssUrl
    };

    // Create providers with authentication headers
    this.wsProvider = new ethers.WebSocketProvider(this.config.wsUrl, undefined, {
      headers: { 'x-api-key': apiKey }
    });

    this.httpProvider = new ethers.JsonRpcProvider(this.config.url, undefined, {
      headers: { 'x-api-key': apiKey }
    });
    
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

  async makeAuthenticatedRequest(method, params = []) {
    try {
      // Use the JsonRpcProvider for RPC calls instead of direct fetch
      const result = await this.httpProvider.send(method, params);
      return result;
    } catch (error) {
      console.error(`Failed to make authenticated request to ${method}:`, error);
      throw error;
    }
  }

  async analyzeTransaction(transactionData, network = 'ethereum') {
    try {
      // Validate transaction data
      if (!transactionData || typeof transactionData !== 'object') {
        throw new Error('Invalid transaction data');
      }

      // Handle different transaction formats
      let gasPrice;
      try {
        gasPrice = transactionData.gasPrice || 
                   transactionData.maxFeePerGas || 
                   await this.makeAuthenticatedRequest('eth_gasPrice');
      } catch (error) {
        console.warn('Failed to get gas price, using default:', error);
        gasPrice = '0x' + (50n * 1000000000n).toString(16); // Default 50 Gwei
      }
      
      const gasLimit = transactionData.gasLimit || 
                      transactionData.gas || 
                      '0x5208'; // Default to 21000 gas

      // Get current network conditions with retries
      const getNetworkConditions = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const block = await this.makeAuthenticatedRequest('eth_getBlockByNumber', ['latest', false]);
            
            // For networks that don't support EIP-1559, handle gracefully
            const baseFeePerGas = block?.baseFeePerGas ? 
              parseInt(block.baseFeePerGas, 16) / 1e9 : null;

            // Fallback priority fee calculation if maxPriorityFeePerGas is not supported
            let maxPriorityFeePerGas;
            try {
              maxPriorityFeePerGas = await this.makeAuthenticatedRequest('eth_maxPriorityFeePerGas', []);
              maxPriorityFeePerGas = parseInt(maxPriorityFeePerGas, 16) / 1e9;
            } catch (error) {
              console.warn('maxPriorityFeePerGas not supported, using calculated value');
              maxPriorityFeePerGas = baseFeePerGas ? 
                (parseInt(gasPrice, 16) / 1e9 - baseFeePerGas) : 
                2; // Default 2 Gwei priority fee
            }
            
            return { baseFeePerGas, maxPriorityFeePerGas };
          } catch (error) {
            console.warn(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      };

      const networkConditions = await getNetworkConditions();
      const gasPriceGwei = typeof gasPrice === 'string' ? 
        parseInt(gasPrice, 16) / 1e9 : 
        Number(gasPrice) / 1e9;
      
      const gasLimitValue = typeof gasLimit === 'string' ? 
        parseInt(gasLimit, 16) : 
        Number(gasLimit);

      const currentThresholds = this.thresholds[network] || this.thresholds.ethereum;

      // Analysis structure
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
          baseFeePerGas: networkConditions.baseFeePerGas,
          maxPriorityFeePerGas: networkConditions.maxPriorityFeePerGas,
          priceLevel: gasPriceGwei <= currentThresholds.low ? 'low' :
                     gasPriceGwei <= currentThresholds.medium ? 'medium' : 'high',
          estimatedCost: (gasPriceGwei * gasLimitValue) / 1e9
        },
        suggestions: []
      };

      // Generate optimization suggestions
      if (gasPriceGwei > currentThresholds.high) {
        analysis.suggestions.push({
          type: 'delay',
          message: 'Gas prices are high. Consider delaying non-urgent transactions.',
          severity: 'high'
        });
      }

      // Check if EIP-1559 optimization is possible
      if (networkConditions.baseFeePerGas) {
        const potentialBaseFee = Math.min(
          networkConditions.baseFeePerGas * 1.125, 
          networkConditions.baseFeePerGas + 2
        );
        const potentialPriorityFee = Math.min(
          networkConditions.maxPriorityFeePerGas * 0.9, 
          networkConditions.maxPriorityFeePerGas
        );
        const potentialTotalFee = potentialBaseFee + potentialPriorityFee;

        if (gasPriceGwei > potentialTotalFee) {
          analysis.suggestions.push({
            type: 'eip1559',
            message: `Consider using EIP-1559 with base fee of ${potentialBaseFee.toFixed(2)} Gwei and priority fee of ${potentialPriorityFee.toFixed(2)} Gwei`,
            severity: 'medium'
          });

          // Calculate potential savings
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