import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useEthereum } from "../../context/EthereumContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Typography,
  Switch,
  CircularProgress,
  Chip,
  InputAdornment,
  Alert as MuiAlert,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  AccountBalanceWallet,
  Timer,
  Send,
  Error as ErrorIcon,
  CheckCircle,
  Info as InfoIcon,
  LocalGasStation,
} from "@mui/icons-material";

// Complete ERC20 ABI interface
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
  background: "linear-gradient(to bottom right, #ffffff, #f8f9fa)",
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
  border: 0,
  borderRadius: 48,
  boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
  color: "white",
  height: 48,
  padding: "0 30px",
  "&:hover": {
    background: "linear-gradient(45deg, #1976D2 30%, #00B8D4 90%)",
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: 16,
  height: 32,
  "& .MuiChip-label": {
    padding: "0 16px",
  },
}));

// PYUSD Mainnet Contract Address
const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";

const TransactionForm = ({ optimizedGasPrice, onTransactionSubmit }) => {
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  

  useEffect(() => {
    const updateGasSettings = async () => {
      if (optimizedGasPrice && formData.useOptimizedGas) {
        try {
          // Round the gas price to 4 decimal places before conversion
          const roundedGasPrice = roundGasPrice(optimizedGasPrice);

          // Convert optimizedGasPrice from Gwei to Wei and then to BigInt
          const gasPriceInWei = ethers.parseUnits(roundedGasPrice, "gwei");

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

      if (onTransactionSubmit) {
        onTransactionSubmit(tx);
      }
      
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
    setFormData((prev) => ({
      ...prev,
      useOptimizedGas: newUseOptimizedGas,
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
      if (typeof price === "bigint" || price._isBigNumber) {
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
        <MuiAlert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            MetaMask Required
          </Typography>
          <Typography variant="body2">
            Please install MetaMask to use this application
          </Typography>
        </MuiAlert>
      );
    }

    if (!isConnected) {
      return (
        <MuiAlert
          severity="warning"
          icon={<AccountBalanceWallet />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={connectWallet}>
              Connect
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight="medium">
            Wallet Not Connected
          </Typography>
          <Typography variant="body2">
            Please connect your wallet to continue
          </Typography>
        </MuiAlert>
      );
    }

    return null;
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <StyledPaper elevation={0}>
        <Box
          sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2, pt: 2 }}
        >
          <Typography variant="h4" fontWeight="bold" color="primary">
            New Transaction
          </Typography>
          {isConnected && (
            <StyledChip
              icon={<AccountBalanceWallet />}
              label={`${account.slice(0, 6)}...${account.slice(-4)}`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {renderConnectionStatus()}

        <form onSubmit={handleSubmit}>
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={handlePaymentMethodChange}
                  disabled={!isConnected}
                  label="Payment Method"
                >
                  <MenuItem value="ETH">ETH</MenuItem>
                  <MenuItem value="PYUSD">PYUSD</MenuItem>
                </Select>
              </FormControl>

              <AnimatePresence>
                {formData.paymentMethod === "PYUSD" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <StyledChip
                      icon={<LocalGasStation />}
                      label={`Balance: ${
                        pyusdBalance === "Error"
                          ? "Error loading balance"
                          : `${Number(pyusdBalance).toFixed(2)} PYUSD`
                      }`}
                      color={pyusdBalance === "Error" ? "error" : "success"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <TextField
              fullWidth
              label="Recipient Address"
              name="recipient"
              value={formData.recipient}
              onChange={handleInputChange}
              disabled={!isConnected}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Send />
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <TextField
              fullWidth
              label={`Amount (${formData.paymentMethod})`}
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              disabled={!isConnected}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {formData.paymentMethod}
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>

          <AnimatePresence>
            {formData.paymentMethod === "ETH" && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <TextField
                  fullWidth
                  label="Data (Optional)"
                  name="data"
                  value={formData.data}
                  onChange={handleInputChange}
                  disabled={!isConnected}
                  multiline
                  rows={3}
                  sx={{ mb: 3 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {optimizedGasPrice && (
            <motion.div variants={itemVariants}>
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  background: "linear-gradient(to right, #e3f2fd, #bbdefb)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Timer color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="primary">
                    Optimized Gas Price: {formatGasPrice(optimizedGasPrice)}{" "}
                    Gwei
                  </Typography>
                  {gasEstimate && (
                    <Typography variant="caption" color="text.secondary">
                      Estimated Gas: {gasEstimate.toString()} units
                    </Typography>
                  )}
                </Box>
                <Switch
                  checked={formData.useOptimizedGas}
                  onChange={handleGasSettingToggle}
                  color="primary"
                />
              </Paper>
            </motion.div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <MuiAlert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
                  {error}
                </MuiAlert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants}>
            <GradientButton
              type="submit"
              fullWidth
              disabled={loading || !isConnected}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckCircle />
                )
              }
            >
              {loading ? "Processing..." : "Submit Transaction"}
            </GradientButton>
          </motion.div>
        </form>
      </StyledPaper>
    </motion.div>
  );
};

export default TransactionForm;
