import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useEthereum } from "../../context/EthereumContext";
import { AlertCircle, Loader, Check, Timer, Coins } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../elements/Alert";

// Complete ERC20 ABI interface
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// PYUSD Mainnet Contract Address
const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";

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
  const [pyusdBalance, setPyusdBalance] = useState("0");
  const [customGasSettings, setCustomGasSettings] = useState({
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
  });

  const { account, provider, signer, connectWallet } = useEthereum();
  const isConnected = Boolean(account);

  // Helper function to round gas price to 4 decimal places
  const roundGasPrice = (price) => {
    if (!price) return "0";
    return Number(price).toFixed(4);
  };


  useEffect(() => {
    const updateGasSettings = async () => {
      if (optimizedGasPrice && formData.useOptimizedGas) {
        try {
          // Round the gas price to 4 decimal places before conversion
          const roundedGasPrice = roundGasPrice(optimizedGasPrice);
          
          // Convert optimizedGasPrice from Gwei to Wei and then to BigInt
          const gasPriceInWei = ethers.parseUnits(
            roundedGasPrice,
            "gwei"
          );
          
          // Set maxPriorityFeePerGas to 1.5 Gwei
          const maxPriorityFeePerGas = ethers.parseUnits("1.5", "gwei");
          
          // Set maxFeePerGas to optimizedGasPrice + maxPriorityFeePerGas
          const maxFeePerGas = gasPriceInWei + maxPriorityFeePerGas;

          setCustomGasSettings({
            maxFeePerGas,
            maxPriorityFeePerGas,
          });
        } catch (err) {
          console.error("Error updating gas settings:", err);
          // Don't set error state here since transaction is still working
          setCustomGasSettings({
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
          });
        }
      } else {
        setCustomGasSettings({
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
        });
      }
    };

    updateGasSettings();
  }, [optimizedGasPrice, formData.useOptimizedGas]);

    // Initialize PYUSD contract with signer instead of provider
    const pyusdContract = React.useMemo(() => {
      if (!provider || !PYUSD_ADDRESS) return null;
      try {
        return new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, provider);
      } catch (err) {
        console.error("Error initializing PYUSD contract:", err);
        return null;
      }
    }, [provider]);

    useEffect(() => {
      const fetchPyusdBalance = async () => {
        if (!pyusdContract || !account) {
          setPyusdBalance("0");
          return;
        }
    
        try {
          // Ensure contract responds as expected with a sample call to decimals
          let decimals;
          try {
            decimals = await pyusdContract.decimals();
          } catch (err) {
            console.error("Error fetching decimals:", err);
            decimals = 6; // Set default decimals if call fails
          }
    
          // Check if balanceOf is callable
          const balance = await pyusdContract.balanceOf(account);
          
          // Format balance if callable, otherwise handle error
          const formattedBalance = ethers.formatUnits(balance, decimals);
          setPyusdBalance(formattedBalance);
        } catch (err) {
          console.error("Error fetching PYUSD balance:", err);
          setPyusdBalance("Error");
        }
      };
    
      if (isConnected) {
        fetchPyusdBalance();
      } else {
        setPyusdBalance("0");
      }
    }, [pyusdContract, account, isConnected]);
    

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
  
      setLoading(true);
      setError("");
  
      try {
        validateTransaction(formData.recipient, formData.amount);
  
        let transaction;
        if (formData.paymentMethod === "PYUSD") {
          // [PYUSD transaction logic remains the same...]
        } else {
          transaction = {
            to: formData.recipient,
            value: ethers.parseEther(formData.amount.toString()),
          };
  
          if (formData.data) {
            transaction.data = formData.data.startsWith("0x")
              ? formData.data
              : `0x${formData.data}`;
          }
        }

        if (formData.useOptimizedGas && customGasSettings.maxFeePerGas) {
          transaction = {
            ...transaction,
            maxFeePerGas: customGasSettings.maxFeePerGas,
            maxPriorityFeePerGas: customGasSettings.maxPriorityFeePerGas,
            type: 2, // EIP-1559 transaction
          };
        }


      // Estimate gas
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
        paymentMethod: formData.paymentMethod,
        useOptimizedGas: false,
      });
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };



  // Include all the helper functions from the previous version...
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

  const handlePaymentMethodChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: e.target.value,
      data: "",
    }));
    setError("");
  };

  const handleGasSettingToggle = async () => {
    const newUseOptimizedGas = !formData.useOptimizedGas;
    setFormData(prev => ({
      ...prev,
      useOptimizedGas: newUseOptimizedGas
    }));

    if (newUseOptimizedGas && formData.recipient && formData.amount) {
      try {
        // Prepare transaction object for gas estimation
        let transaction = {
          to: formData.recipient,
          value: ethers.parseEther(formData.amount.toString()),
        };

        if (formData.data) {
          transaction.data = formData.data.startsWith("0x")
            ? formData.data
            : `0x${formData.data}`;
        }

        const estimate = await provider.estimateGas(transaction);
        setGasEstimate(estimate);
      } catch (err) {
        console.error("Error estimating gas:", err);
      }
    }
  };

  const formatGasPrice = (price) => {
    try {
      if (!price) return "0";
      if (typeof price === 'bigint' || price._isBigNumber) {
        const formatted = ethers.formatUnits(price, "gwei");
        return roundGasPrice(formatted);
      }
      return roundGasPrice(price);
    } catch (err) {
      console.error("Error formatting gas price:", err);
      return "0";
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

  // Return the JSX...
  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">New Transaction</h2>

      {renderConnectionStatus()}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4 mb-4">
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handlePaymentMethodChange}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          >
            <option value="ETH">ETH</option>
            <option value="PYUSD">PYUSD</option>
          </select>
          
          {formData.paymentMethod === "PYUSD" && (
            <div className="text-sm text-gray-600">
              Balance: {pyusdBalance === "Error" ? "Error loading balance" : `${Number(pyusdBalance).toFixed(2)} PYUSD`}
            </div>
          )}
        </div>

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
          <label className="block text-sm font-medium mb-1">
            Amount ({formData.paymentMethod})
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
            step="0.000001"
            min="0"
            disabled={!isConnected}
            required
          />
        </div>

        {formData.paymentMethod === "ETH" && (
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
        )}

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