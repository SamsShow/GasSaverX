import { ethers } from 'ethers';

class RateLimitedQuickNodeClient {
  constructor(config) {
    this.config = config;
    this.requestQueue = [];
    this.processing = false;
    this.requestsThisSecond = 0;
    this.lastRequestTime = Date.now();
    this.MAX_REQUESTS_PER_SECOND = 120;
    this.providers = {
      ws: new ethers.WebSocketProvider(config.wsUrl, undefined, {
        headers: { 'x-api-key': config.apiKey }
      }),
      http: new ethers.JsonRpcProvider(config.url, undefined, {
        headers: { 'x-api-key': config.apiKey }
      })
    };
  }

  async enqueueRequest(method, params = []) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        method,
        params,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      
      // Reset counter if a second has passed
      if (now - this.lastRequestTime >= 1000) {
        this.requestsThisSecond = 0;
        this.lastRequestTime = now;
      }

      
      if (this.requestsThisSecond >= this.MAX_REQUESTS_PER_SECOND) {
        await new Promise(resolve => 
          setTimeout(resolve, 1000 - (now - this.lastRequestTime))
        );
        continue;
      }

      const request = this.requestQueue.shift();
      this.requestsThisSecond++;

      try {
        const result = await this.providers.http.send(
          request.method, 
          request.params
        );
        request.resolve(result);
      } catch (error) {
        if (error.message.includes('request limit reached')) {
          
          this.requestQueue.unshift(request);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        request.reject(error);
      }
    }

    this.processing = false;
  }

  async getTransactionByHash(hash) {
    return this.enqueueRequest('eth_getTransactionByHash', [hash]);
  }

  async getBlockByNumber(blockNumber, includeTransactions = false) {
    return this.enqueueRequest('eth_getBlockByNumber', [blockNumber, includeTransactions]);
  }

  async getGasPrice() {
    return this.enqueueRequest('eth_gasPrice');
  }

  async getMaxPriorityFeePerGas() {
    return this.enqueueRequest('eth_maxPriorityFeePerGas');
  }

  // Batching helper for multiple transactions
  async batchGetTransactions(hashes) {
    const batchSize = 10; // Process 10 at a time
    const results = [];
    
    for (let i = 0; i < hashes.length; i += batchSize) {
      const batch = hashes.slice(i, i + batchSize);
      const batchPromises = batch.map(hash => this.getTransactionByHash(hash));
      results.push(...await Promise.all(batchPromises));
    }
    
    return results;
  }

  
  subscribeToNewBlocks(callback) {
    return this.providers.ws.on('block', callback);
  }

  subscribeToPendingTransactions(callback) {
    return this.providers.ws.on('pending', callback);
  }

  // Cleanup method
  destroy() {
    this.providers.ws.removeAllListeners();
    this.providers.ws._websocket.close();
  }
}

export const createRateLimitedClient = (config) => {
  return new RateLimitedQuickNodeClient(config);
};