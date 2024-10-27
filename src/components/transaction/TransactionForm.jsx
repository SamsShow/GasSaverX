import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '../../context/EthereumContext';
import { AlertCircle, Loader, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';

const TransactionForm = () => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    data: '',
    paymentMethod: 'ETH'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gasEstimate, setGasEstimate] = useState(null);
  
  const { 
    account, 
    provider, 
    signer, 
    connectWallet 
  } = useEthereum();
  
  // Compute isConnected based on account existence
  const isConnected = Boolean(account);
  
  // Check wallet connection on mount
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== 'undefined' && !isConnected) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0 && !account) {
          await connectWallet();
        }
      }
    };

    checkWallet();
  }, []);

  const validateTransaction = (recipient, amount) => {
    if (!recipient || !amount) {
      throw new Error('Please fill in all required fields');
    }

    try {
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }

      // Validate amount is a valid number
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount');
      }

      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear any previous errors when user makes changes
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet first');
        return;
      }
    }
    
    if (!signer || !provider) {
      setError('Wallet connection not initialized properly');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Validate transaction data
      validateTransaction(formData.recipient, formData.amount);

      const transaction = {
        to: formData.recipient,
        value: ethers.parseEther(formData.amount.toString())
      };

      if (formData.data) {
        // Ensure data is properly formatted as hex
        transaction.data = formData.data.startsWith('0x') 
          ? formData.data 
          : `0x${formData.data}`;
      }

      // Get gas estimate before sending transaction
      try {
        const estimate = await provider.estimateGas(transaction);
        setGasEstimate(estimate);
      } catch (gasErr) {
        throw new Error('Failed to estimate gas. The transaction may fail.');
      }

      const tx = await signer.sendTransaction(transaction);
      await tx.wait();

      // Clear form after successful transaction
      setFormData({
        recipient: '',
        amount: '',
        data: '',
        paymentMethod: 'ETH'
      });
      
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Connection status alert
  const renderConnectionStatus = () => {
    if (!window.ethereum) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>MetaMask Required</AlertTitle>
          <AlertDescription>
            Please install MetaMask to use this application
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!isConnected) {
      return (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to continue
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">New Transaction</h2>
      
      {renderConnectionStatus()}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            name="recipient"
            value={formData.recipient}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
            disabled={!isConnected}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
            step="0.000000000000000001"
            min="0"
            disabled={!isConnected}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Data (Optional)</label>
          <textarea
            name="data"
            value={formData.data}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
            rows="3"
            disabled={!isConnected}
          />
        </div>
        
        {gasEstimate && (
          <div className="text-sm text-gray-600">
            Estimated Gas: {gasEstimate.toString()} units
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <button
          type="submit"
          disabled={loading || !isConnected}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin h-4 w-4" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Submit Transaction</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;