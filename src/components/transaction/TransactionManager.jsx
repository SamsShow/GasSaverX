import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [optimizedGasPrice, setOptimizedGasPrice] = useState(null);
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const initializeProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        
        // Get initial account
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error("Error getting accounts:", err);
        }

       
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setAccount(null);
          }
        });
      }
    };

    initializeProvider();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Update gas price periodically
  useEffect(() => {
    const updateGasPrice = async () => {
      if (provider) {
        try {
          const feeData = await provider.getFeeData();
          setOptimizedGasPrice(ethers.formatUnits(feeData.gasPrice, "gwei"));
        } catch (err) {
          console.error("Error fetching gas price:", err);
        }
      }
    };

    updateGasPrice();
    const interval = setInterval(updateGasPrice, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [provider]);

  const handleTransactionSubmit = async (transaction) => {
    const newTx = {
      hash: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value.toString(),
      timestamp: Math.floor(Date.now() / 1000),
      status: 'pending'
    };

    setTransactions(prev => [newTx, ...prev]);

    try {
     
      const receipt = await provider.waitForTransaction(transaction.hash);
      
      // Update transaction status
      setTransactions(prev => prev.map(tx => 
        tx.hash === transaction.hash 
          ? { ...tx, status: receipt.status === 1 ? 'success' : 'failed' }
          : tx
      ));
    } catch (err) {
      console.error("Error monitoring transaction:", err);
      setTransactions(prev => prev.map(tx => 
        tx.hash === transaction.hash 
          ? { ...tx, status: 'failed' }
          : tx
      ));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <TransactionForm 
        optimizedGasPrice={optimizedGasPrice}
        onTransactionSubmit={handleTransactionSubmit}
      />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Transaction History
        </h2>
        <TransactionHistory 
          provider={provider}
          userAddress={account}
          transactions={transactions}
        />
      </div>
    </div>
  );
};

export default TransactionManager;