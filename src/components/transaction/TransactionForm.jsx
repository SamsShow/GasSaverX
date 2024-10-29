import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useEthereum } from "../../context/EthereumContext";
import { AlertCircle, Loader, Check, Timer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../elements/Alert";

const TransactionForm = ({ optimizedGasPrice }) => {
  const [formData, setFormData] = useState({
    recipient: "",
    amount: "",
    data: "",
    paymentMethod: "ETH",
    useOptimizedGas: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gasEstimate, setGasEstimate] = useState(null);
  const [customGasSettings, setCustomGasSettings] = useState({
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
  });

  const { account, provider, signer, connectWallet } = useEthereum();
  const isConnected = Boolean(account);

  // Update gas settings when optimized price is received
  useEffect(() => {
    if (optimizedGasPrice) {
      try {
        // Round to 9 decimal places and remove any excess trailing zeros
        const roundedGasPrice = Number(parseFloat(optimizedGasPrice).toFixed(9));
        
        // Convert the rounded number to a string with fixed precision
        const gweiString = roundedGasPrice.toString();
        
        try {
          const weiValue = ethers.parseUnits(gweiString, "gwei");
          setCustomGasSettings({
            maxFeePerGas: weiValue,
            maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
          });
        } catch (parseError) {
          console.warn("Failed to parse gas price, falling back to default:", parseError);
          // Fallback to a safe default if parsing fails
          setCustomGasSettings({
            maxFeePerGas: ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
          });
        }
      } catch (err) {
        console.error("Error setting gas price:", err);
        setError("Invalid gas price received");
      }
    }
  }, [optimizedGasPrice]);

  // Format gas price safely for display
  const formatGasPrice = (price) => {
    try {
      if (!price) return "0";
      
      // Handle BigNumber or BigInt
      if (typeof price === 'bigint' || price._isBigNumber) {
        const formatted = ethers.formatUnits(price, "gwei");
        return Number(formatted).toFixed(2);
      }
      
      // Handle decimal number
      return Number(price).toFixed(2);
    } catch (err) {
      console.error("Error formatting gas price:", err);
      return "0";
    }
  };

  // Rest of the component remains the same
  const validateTransaction = (recipient, amount) => {
    if (!recipient || !amount) {
      throw new Error("Please fill in all required fields");
    }

    try {
      if (!ethers.isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Invalid amount");
      }

      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleGasSettingToggle = () => {
    setFormData((prev) => ({
      ...prev,
      useOptimizedGas: !prev.useOptimizedGas,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError("Please connect your wallet first");
        return;
      }
    }

    if (!signer || !provider) {
      setError("Wallet connection not initialized properly");
      return;
    }

    setLoading(true);
    setError("");

    try {
      validateTransaction(formData.recipient, formData.amount);

      const transaction = {
        to: formData.recipient,
        value: ethers.parseEther(formData.amount.toString()),
      };

      if (formData.data) {
        transaction.data = formData.data.startsWith("0x")
          ? formData.data
          : `0x${formData.data}`;
      }

      if (formData.useOptimizedGas && customGasSettings.maxFeePerGas) {
        transaction.maxFeePerGas = customGasSettings.maxFeePerGas;
        transaction.maxPriorityFeePerGas = customGasSettings.maxPriorityFeePerGas;
        transaction.type = 2;
      }

      try {
        const estimate = await provider.estimateGas(transaction);
        setGasEstimate(estimate);
      } catch (gasErr) {
        throw new Error("Failed to estimate gas. The transaction may fail.");
      }

      const tx = await signer.sendTransaction(transaction);
      await tx.wait();

      setFormData({
        recipient: "",
        amount: "",
        data: "",
        paymentMethod: "ETH",
        useOptimizedGas: false,
      });
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

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
          <label className="block text-sm font-medium mb-1">
            Recipient Address
          </label>
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
          <label className="block text-sm font-medium mb-1">
            Data (Optional)
          </label>
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

        {optimizedGasPrice && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
            <Timer className="h-4 w-4 text-blue-500" />
            <label className="flex items-center space-x-2 text-sm text-blue-700">
              <input
                type="checkbox"
                checked={formData.useOptimizedGas}
                onChange={handleGasSettingToggle}
                className="rounded border-blue-500 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Use optimized gas settings ({formatGasPrice(optimizedGasPrice)}{" "}
                Gwei)
              </span>
            </label>
          </div>
        )}

        {gasEstimate && (
          <div className="text-sm text-gray-600">
            Estimated Gas: {gasEstimate.toString()} units
            {formData.useOptimizedGas && customGasSettings.maxFeePerGas && (
              <div className="text-blue-600">
                Max Fee: {formatGasPrice(customGasSettings.maxFeePerGas)} Gwei
              </div>
            )}
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