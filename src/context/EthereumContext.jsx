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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize provider on mount
  useEffect(() => {
    const initializeProvider = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(newProvider);
          setIsInitialized(true);

          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            try {
              const newSigner = await newProvider.getSigner();
              setAccount(accounts[0]);
              setSigner(newSigner);
              await getTransactionHistory(newProvider, accounts[0]);
            } catch (signerError) {
              console.error('Error getting signer:', signerError);
            }
          }

          // Setup event listeners
          window.ethereum.on('accountsChanged', (accounts) => 
            handleAccountsChanged(accounts, newProvider)
          );
          window.ethereum.on('chainChanged', () => window.location.reload());
          
        } catch (err) {
          console.error('Error initializing provider:', err);
          setError('Failed to initialize provider');
          setIsInitialized(true); // Still set initialized to true so we can show proper error states
        }
      } else {
        setError('Please install MetaMask!');
        setIsInitialized(true);
      }
    };

    initializeProvider();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const getTransactionHistory = async (currentProvider, currentAccount) => {
    if (!currentProvider || !currentAccount) {
      return [];
    }

    try {
      const currentBlock = await currentProvider.getBlockNumber();
      const transactions = [];

      for (let i = 0; i < 100; i++) {
        const block = await currentProvider.getBlock(currentBlock - i, true);
        if (!block) continue;

        const relevantTxs = block.transactions.filter(tx => 
          tx.from?.toLowerCase() === currentAccount.toLowerCase() ||
          tx.to?.toLowerCase() === currentAccount.toLowerCase()
        );

        for (const tx of relevantTxs) {
          const receipt = await currentProvider.getTransactionReceipt(tx.hash);
          
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            gasSaved: '0',
            status: receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending',
            timestamp: (await currentProvider.getBlock(tx.blockNumber)).timestamp * 1000
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

  const handleAccountsChanged = async (accounts, currentProvider) => {
    if (accounts.length === 0) {
      setAccount(null);
      setSigner(null);
      setTransactions([]);
    } else if (accounts[0] !== account) {
      if (!currentProvider) {
        console.error('Provider not initialized');
        return;
      }

      try {
        const newSigner = await currentProvider.getSigner();
        setAccount(accounts[0]);
        setSigner(newSigner);
        await getTransactionHistory(currentProvider, accounts[0]);
      } catch (err) {
        console.error('Error updating signer:', err);
        setError('Failed to update account');
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    if (!isInitialized) {
      setError('Provider initialization in progress. Please wait...');
      return;
    }

    if (!provider) {
      try {
        // Attempt to reinitialize provider
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);
      } catch (err) {
        setError('Failed to initialize provider. Please refresh the page.');
        return;
      }
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        try {
          const newSigner = await provider.getSigner();
          setAccount(accounts[0]);
          setSigner(newSigner);
          await getTransactionHistory(provider, accounts[0]);
        } catch (signerError) {
          console.error('Error getting signer:', signerError);
          setError('Failed to get signer. Please try again.');
          setAccount(null);
        }
      }
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
    isConnected: Boolean(account),
    isConnecting,
    provider,
    signer,
    error,
    transactions,
    isInitialized,
    connectWallet,
    disconnectWallet,
    getTransactionHistory: () => getTransactionHistory(provider, account)
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