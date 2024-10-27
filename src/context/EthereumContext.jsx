import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const EthereumContext = createContext();

export function EthereumProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);

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

  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // Disconnected
      setAccount(null);
      setSigner(null);
    } else if (accounts[0] !== account) {
      // Account changed
      setAccount(accounts[0]);
      if (provider) {
        const signer = await provider.getSigner();
        setSigner(signer);
      }
    }
  };

  // Check existing connection
  const checkConnection = async (provider) => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const signer = await provider.getSigner();
        setSigner(signer);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get provider and signer
      const signer = await provider.getSigner();
      
      // Set state
      setAccount(accounts[0]);
      setSigner(signer);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
  };

  const value = {
    account,
    isConnecting,
    provider,
    signer,
    error,
    connectWallet,
    disconnectWallet
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