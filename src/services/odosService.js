const ODOS_BASE_URL = 'https://api.odos.xyz';

export class OdosService {
  constructor() {
    this.baseUrl = ODOS_BASE_URL;
  }

  async getQuote(params) {
    try {
      // Validate required parameters
      if (!params.chainId || !params.inputTokens || !params.outputTokens) {
        throw new Error('Missing required parameters: chainId, inputTokens, or outputTokens');
      }

      // Ensure amounts are strings
      params.inputTokens = params.inputTokens.map(token => ({
        ...token,
        amount: token.amount.toString()
      }));

      // Format request body according to Odos API specs
      const requestBody = {
        chainId: Number(params.chainId),
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        userAddr: params.userAddr,
        slippageLimitPercent: params.slippageLimitPercent,
        gasPrice: params.gasPrice ? params.gasPrice.toString() : undefined,
        referralCode: "YourReferralCode", // Optional: Add your Odos referral code
        pathViz: true
      };

      const response = await fetch(`${this.baseUrl}/sor/quote/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `SOR API error: ${response.status}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching SOR quote:', error);
      throw error;
    }
  }
  // Token Pricing API
  async getTokenPrices(chainId, tokenAddresses) {
    try {
      const queryParams = new URLSearchParams({
        chainId: chainId.toString(),
        tokens: tokenAddresses.join(',')
      });

      const response = await fetch(
        `${this.baseUrl}/pricing/token?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pricing API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching token prices:', error);
      throw error;
    }
  }

  // Get contract addresses for common tokens on a specific chain
  async getChainTokens(chainId) {
    try {
      console.log(`Fetching tokens for chain ${chainId} from ${this.baseUrl}/tokens/${chainId}`);
      
      const response = await fetch(
        `${this.baseUrl}/tokens/${chainId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token fetch error response:', errorText);
        throw new Error(`Chain tokens API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Token data received:', data);

      // Validate and format the response
      if (!Array.isArray(data)) {
        console.error('Invalid token data format:', data);
        throw new Error('Invalid token data format received from API');
      }

      // Filter out invalid tokens and ensure required properties
      return data
        .filter(token => token && token.address && token.symbol)
        .map(token => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name || token.symbol,
          decimals: token.decimals || 18
        }));

    } catch (error) {
      console.error('Error fetching chain tokens:', error);
      throw error;
    }
  } 
}

export default new OdosService();