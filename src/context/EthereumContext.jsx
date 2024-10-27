import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const EthereumContext = createContext();

export function EthereumProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Initialize provider on mount
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      // Handle account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Handle chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Check if already connected
      checkConnection(provider);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Get transaction history
  const getTransactionHistory = async () => {
    if (!provider || !account) {
      return [];
    }

    try {
      // Get the last 100 blocks
      const currentBlock = await provider.getBlockNumber();
      const transactions = [];

      // Fetch transactions for the current account
      for (let i = 0; i < 100; i++) {
        const block = await provider.getBlock(currentBlock - i, true);
        if (!block) continue;

        const relevantTxs = block.transactions.filter(tx => 
          tx.from?.toLowerCase() === account.toLowerCase() ||
          tx.to?.toLowerCase() === account.toLowerCase()
        );

        for (const tx of relevantTxs) {
          const receipt = await provider.getTransactionReceipt(tx.hash);
          
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            gasSaved: '0', // This would need to be calculated based on your gas saving logic
            status: receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending',
            timestamp: (await provider.getBlock(tx.blockNumber)).timestamp * 1000
          });
        }
      }

      setTransactions(transactions);
      return transactions;
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      throw err;
    }
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // Disconnected
      setAccount(null);
      setSigner(null);
      setTransactions([]);
    } else if (accounts[0] !== account) {
      // Account changed
      setAccount(accounts[0]);
      if (provider) {
        const signer = await provider.getSigner();
        setSigner(signer);
        // Fetch new account's transactions
        await getTransactionHistory();
      }
    }
  };

  // Other existing functions remain the same...
  const checkConnection = async (provider) => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const signer = await provider.getSigner();
        setSigner(signer);
        await getTransactionHistory();
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const signer = await provider.getSigner();
      setAccount(accounts[0]);
      setSigner(signer);
      await getTransactionHistory();
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setTransactions([]);
  };

  const value = {
    account,
    isConnecting,
    provider,
    signer,
    error,
    transactions,
    connectWallet,
    disconnectWallet,
    getTransactionHistory
  };

  return (
    <EthereumContext.Provider value={value}>
      {children}
    </EthereumContext.Provider>
  );
}

export function useEthereum() {
  const context = useContext(EthereumContext);
  if (!context) {
    throw new Error('useEthereum must be used within an EthereumProvider');
  }
  return context;
}