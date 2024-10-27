import { ethers } from 'ethers';

// Format gas price from wei to gwei with units
export const formatGasPrice = (gasPriceWei) => {
  const gasPriceGwei = ethers.formatUnits(gasPriceWei, 'gwei');
  return `${parseFloat(gasPriceGwei).toFixed(2)} Gwei`;
};

// Format ether value
export const formatEther = (value) => {
  return ethers.formatEther(value);
};

// Parse ether value
export const parseEther = (value) => {
  if (!value || value === '') return ethers.parseEther('0');
  return ethers.parseEther(value);
};

// Shorten address for display
export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Alias for shortenAddress to maintain compatibility
export const formatAddress = shortenAddress;

// Format timestamp to readable date
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

// Calculate percentage change
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return '0%';
  const change = ((newValue - oldValue) / oldValue) * 100;
  return `${change.toFixed(2)}%`;
};

// Validate Ethereum address
export const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Format number with commas
export const formatNumber = (number) => {
  return new Intl.NumberFormat().format(number);
};

// Convert wei to USD using ETH price
export const convertWeiToUSD = (weiAmount, ethPrice) => {
  const ethValue = parseFloat(ethers.formatEther(weiAmount));
  return (ethValue * ethPrice).toFixed(2);
};

// Check if user has sufficient balance
export const checkSufficientBalance = async (signer, amount) => {
  if (!signer) return false;
  const balance = await signer.getBalance();
  return balance.gte(amount);
};

// Handle transaction error messages
export const getErrorMessage = (error) => {
  if (error.reason) return error.reason;
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
};

// Validate transaction parameters
export const validateTransaction = (to, value, data) => {
  if (!isValidAddress(to)) {
    throw new Error('Invalid recipient address');
  }
  
  if (value && isNaN(parseFloat(value))) {
    throw new Error('Invalid transaction value');
  }
  
  if (data && !ethers.isHexString(data)) {
    throw new Error('Invalid transaction data');
  }
  
  return true;
};

// Get network name from chain ID
export const getNetworkName = (chainId) => {
  const networks = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet'
  };
  return networks[chainId] || 'Unknown Network';
};

// Calculate gas savings in USD
export const calculateGasSavings = (savedGas, gasPrice, ethPrice) => {
  const savedWei = savedGas.mul(gasPrice);
  const savedEth = parseFloat(ethers.formatEther(savedWei));
  return (savedEth * ethPrice).toFixed(2);
};