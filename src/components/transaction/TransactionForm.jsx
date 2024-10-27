import React, { useState, useEffect } from 'react';
import { useEthereum } from '../../hooks/useEthereum';
import { useGasSaver } from '../../hooks/useGasSaver';
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
  
  const { account, isConnected } = useEthereum();
  const { estimateGasCost, executeTransaction } = useGasSaver();
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  useEffect(() => {
    const estimateGas = async () => {
      if (formData.recipient && formData.amount) {
        try {
          const estimate = await estimateGasCost(formData);
          setGasEstimate(estimate);
          setError('');
        } catch (err) {
          setError('Failed to estimate gas cost');
          setGasEstimate(null);
        }
      }
    };
    
    estimateGas();
  }, [formData.recipient, formData.amount]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await executeTransaction(formData);
      setFormData({
        recipient: '',
        amount: '',
        data: '',
        paymentMethod: 'ETH'
      });
    } catch (err) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">New Transaction</h2>
      
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
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="ETH">ETH</option>
            <option value="PYUSD">PYUSD</option>
          </select>
        </div>
        
        {gasEstimate && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Estimated Gas Cost</AlertTitle>
            <AlertDescription>
              {gasEstimate.eth} ETH (${gasEstimate.usd})
            </AlertDescription>
          </Alert>
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