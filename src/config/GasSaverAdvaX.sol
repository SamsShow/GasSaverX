// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title GasSaverX
 * @dev Enhanced contract for optimizing gas fees with additional features
 */
contract GasSaverX is Ownable, ReentrancyGuard, Pausable, AutomationCompatible {
    // Chainlink Price Feed interfaces
    AggregatorV3Interface public ethUsdPriceFeed;
    
    // PYUSD token interface
    IERC20 public pyusd;
    
    // Struct to store price data
    struct PriceData {
        uint256 ethUsdPrice;
        uint256 lastUpdate;
    }
    
    // Struct for gas price history
    struct GasMetrics {
        uint256 timestamp;
        uint256 gasPrice;
        uint256 blockNumber;
    }
    
    // Price data storage
    PriceData public latestPriceData;
    
    // Gas price history
    GasMetrics[] public gasPriceHistory;
    uint256 public constant MAX_HISTORY_LENGTH = 24; // Store 24 hours of hourly data
    
    // Update interval (1 hour)
    uint256 public constant UPDATE_INTERVAL = 1 hours;
    
    // Threshold for price deviation (5%)
    uint256 public constant PRICE_DEVIATION_THRESHOLD = 5;
    
    // Gas usage statistics
    mapping(address => uint256) public userTotalGasSaved;
    uint256 public totalGasSaved;
    uint256 public totalTransactions;
    
    // Whitelist for privileged users
    mapping(address => bool) public whitelist;
    
    // Priority fee settings
    uint256 public maxPriorityFeeWei = 3 gwei;
    uint256 public baseMinPriorityFeeWei = 1 gwei;
    
    // Gas price limits
    uint256 public maxGasPrice = 500 gwei;
    uint256 public minGasPrice = 1 gwei;
    
    // New events
    event WhitelistUpdated(address indexed user, bool status);
    event GasLimitUpdated(uint256 newMaxGasPrice, uint256 newMinGasPrice);
    event PriorityFeeUpdated(uint256 newMaxPriorityFee, uint256 newMinPriorityFee);
    event GasMetricsRecorded(uint256 timestamp, uint256 gasPrice, uint256 blockNumber);
    event PricesUpdated(uint256 ethUsdPrice, uint256 timestamp);
    event GasOptimizationTriggered(address indexed user, uint256 savedGas);
    event EmergencyWithdrawal(address indexed token, address indexed to, uint256 amount);
    
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender] || msg.sender == owner(), "Not whitelisted");
        _;
    }
    
    constructor(
        address initialOwner,
        address _pyusdAddress,
        address _ethUsdPriceFeed
    ) Ownable(initialOwner) {
        pyusd = IERC20(_pyusdAddress);
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        whitelist[initialOwner] = true;
        updatePriceData();
    }

    /**
     * @dev Updates whitelist status for a user
     */
    function updateWhitelist(address user, bool status) external onlyOwner {
        whitelist[user] = status;
        emit WhitelistUpdated(user, status);
    }
    
    /**
     * @dev Updates gas price limits
     */
    function updateGasLimits(uint256 newMaxGas, uint256 newMinGas) external onlyOwner {
        require(newMaxGas > newMinGas, "Invalid gas limits");
        maxGasPrice = newMaxGas;
        minGasPrice = newMinGas;
        emit GasLimitUpdated(newMaxGas, newMinGas);
    }
    
    /**
     * @dev Updates priority fee settings
     */
    function updatePriorityFees(uint256 newMaxPriority, uint256 newMinPriority) external onlyOwner {
        require(newMaxPriority > newMinPriority, "Invalid priority fees");
        maxPriorityFeeWei = newMaxPriority;
        baseMinPriorityFeeWei = newMinPriority;
        emit PriorityFeeUpdated(newMaxPriority, newMinPriority);
    }

    /**
     * @dev Records gas metrics for historical analysis
     */
    function recordGasMetrics() internal {
        if (gasPriceHistory.length >= MAX_HISTORY_LENGTH) {
            // Remove oldest entry
            for (uint256 i = 0; i < gasPriceHistory.length - 1; i++) {
                gasPriceHistory[i] = gasPriceHistory[i + 1];
            }
            gasPriceHistory.pop();
        }
        
        gasPriceHistory.push(GasMetrics({
            timestamp: block.timestamp,
            gasPrice: tx.gasprice,
            blockNumber: block.number
        }));
        
        emit GasMetricsRecorded(block.timestamp, tx.gasprice, block.number);
    }

    /**
     * @dev Calculates optimal gas price using historical data and network conditions
     */
    function calculateOptimalGasPrice(uint256 baseGasPrice) 
        public 
        view 
        returns (uint256) 
    {
        uint256 averageGasPrice = baseGasPrice;
        
        // Use historical data if available
        if (gasPriceHistory.length > 0) {
            uint256 totalPrice;
            uint256 count;
            
            // Calculate weighted average of recent gas prices
            for (uint256 i = 0; i < gasPriceHistory.length; i++) {
                totalPrice += gasPriceHistory[i].gasPrice;
                count++;
            }
            
            if (count > 0) {
                averageGasPrice = (totalPrice / count);
            }
        }
        
        // Add priority fee based on network congestion
        uint256 priorityFee = baseMinPriorityFeeWei;
        if (block.basefee > 100 gwei) {
            priorityFee = maxPriorityFeeWei;
        }
        
        // Calculate final gas price with bounds checking
        uint256 finalGasPrice = averageGasPrice + priorityFee;
        if (finalGasPrice > maxGasPrice) return maxGasPrice;
        if (finalGasPrice < minGasPrice) return minGasPrice;
        
        return finalGasPrice;
    }

    /**
     * @dev Get gas price statistics
     */
    function getGasStatistics() external view returns (
        uint256 avgGasPrice,
        uint256 lowestPrice,
        uint256 highestPrice,
        uint256 currentPrice
    ) {
        require(gasPriceHistory.length > 0, "No historical data");
        
        uint256 totalPrice;
        lowestPrice = type(uint256).max;
        highestPrice = 0;
        
        for (uint256 i = 0; i < gasPriceHistory.length; i++) {
            uint256 price = gasPriceHistory[i].gasPrice;
            totalPrice += price;
            if (price < lowestPrice) lowestPrice = price;
            if (price > highestPrice) highestPrice = price;
        }
        
        avgGasPrice = totalPrice / gasPriceHistory.length;
        currentPrice = block.basefee + baseMinPriorityFeeWei;
        
        return (avgGasPrice, lowestPrice, highestPrice, currentPrice);
    }

    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw(address token, address to) external onlyOwner {
        if (token == address(0)) {
            uint256 balance = address(this).balance;
            payable(to).transfer(balance);
            emit EmergencyWithdrawal(address(0), to, balance);
        } else {
            IERC20 tokenContract = IERC20(token);
            uint256 balance = tokenContract.balanceOf(address(this));
            require(tokenContract.transfer(to, balance), "Transfer failed");
            emit EmergencyWithdrawal(token, to, balance);
        }
    }

    /**
     * @dev Pause contract functions
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract functions
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Enhanced executeOptimizedTransaction with additional features
     */
    function executeOptimizedTransaction(
        address to,
        bytes calldata data,
        uint256 value
    ) external payable nonReentrant whenNotPaused {
        uint256 initialGas = gasleft();
        uint256 gasLimit = initialGas - 50000;
        
        (uint256 optimizedGasPrice, uint256 estimatedCost) = optimizeGasUsage(
            to,
            data,
            gasLimit
        );
        
        // Handle payment with additional checks
        if (msg.value > 0) {
            require(msg.value >= estimatedCost, "Insufficient ETH");
        } else {
            uint256 pyusdCost = convertEthToPyusd(estimatedCost);
            require(
                pyusd.transferFrom(msg.sender, address(this), pyusdCost),
                "PYUSD transfer failed"
            );
        }
        
        // Execute transaction with enhanced error handling
        (bool success, bytes memory result) = to.call{value: value, gas: gasLimit}(data);
        require(success, string(abi.encodePacked("Transaction failed: ", result)));
        
        // Record metrics and update statistics
        uint256 gasUsed = initialGas - gasleft();
        uint256 actualCost = gasUsed * optimizedGasPrice;
        uint256 gasSaved = gasLimit - gasUsed;
        
        userTotalGasSaved[msg.sender] += gasSaved;
        totalGasSaved += gasSaved;
        totalTransactions++;
        
        // Record gas metrics for future optimization
        recordGasMetrics();
        
        // Refund excess payment
        if (msg.value > 0 && msg.value > actualCost) {
            payable(msg.sender).transfer(msg.value - actualCost);
        }
        
        emit GasOptimizationTriggered(msg.sender, gasSaved);
    }

     /**
     * @dev Estimates gas cost in PYUSD
     * @param gasLimit Estimated gas limit for the transaction
     * @return estimated cost in PYUSD
     */
    function estimateGasCostInPyusd(uint256 gasLimit) public view returns (uint256) {
        require(latestPriceData.ethUsdPrice > 0, "Price data not available");
        
        // Get current base gas price
        uint256 baseGasPrice = block.basefee;
        
        // Calculate optimal gas price
        uint256 optimizedGasPrice = calculateOptimalGasPrice(baseGasPrice);
        
        // Calculate cost in ETH (gasLimit * gasPrice)
        uint256 ethCost = gasLimit * optimizedGasPrice;
        
        // Convert ETH cost to PYUSD using the latest price data
        return convertEthToPyusd(ethCost);
    }

    /**
     * @dev Optimizes gas usage for a transaction
     * @param to Destination address
     * @param data Transaction data
     * @param gasLimit Estimated gas limit
     */
    function optimizeGasUsage(
        address to,
        bytes calldata data,
        uint256 gasLimit
    ) public view returns (uint256 optimizedGasPrice, uint256 estimatedCost) {
        // Since we removed fastGasPriceFeed, you may want to manually set a baseGasPrice
        uint256 baseGasPrice = tx.gasprice;
        
        // Calculate optimal gas price based on network conditions
        optimizedGasPrice = calculateOptimalGasPrice(baseGasPrice);
        
        // Estimate total cost in PYUSD
        estimatedCost = estimateGasCostInPyusd(gasLimit);
        
        return (optimizedGasPrice, estimatedCost);
    }
    
    /**
     * @dev Updates price data from Chainlink oracles (ETH/USD only)
     */
    function updatePriceData() public {
        // Get ETH/USD price
        (
            ,
            int256 ethUsdPrice,
            ,
            uint256 updatedAt,
            
        ) = ethUsdPriceFeed.latestRoundData();
        
        require(ethUsdPrice > 0, "Invalid ETH price data");
        
        latestPriceData = PriceData({
            ethUsdPrice: uint256(ethUsdPrice),
            lastUpdate: updatedAt
        });
        
        emit PricesUpdated(
            uint256(ethUsdPrice),
            block.timestamp
        );
    }
    
    /**
     * @dev Converts PYUSD amount to ETH using Chainlink price feed
     */
    function convertPyusdToEth(uint256 pyusdAmount) public view returns (uint256) {
        require(latestPriceData.ethUsdPrice > 0, "Price data not available");
        return (pyusdAmount * 1e18) / latestPriceData.ethUsdPrice;
    }

    function convertEthToPyusd(uint256 ethAmount) public view returns (uint256) {
        require(latestPriceData.ethUsdPrice > 0, "Price data not available");
        return (ethAmount * latestPriceData.ethUsdPrice) / 1e18;
    }

    
    /**
     * @dev Chainlink Automation check function
     */
    function checkUpkeep(bytes calldata) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory) 
    {
        upkeepNeeded = (
            block.timestamp - latestPriceData.lastUpdate >= UPDATE_INTERVAL ||
            checkPriceDeviation()
        );
        return (upkeepNeeded, "");
    }
    
    /**
     * @dev Chainlink Automation perform function
     */
    function performUpkeep(bytes calldata) external override {
        updatePriceData();
    }
    
    /**
     * @dev Checks if price deviation exceeds threshold
     */
    function checkPriceDeviation() internal view returns (bool) {
        (
            ,
            int256 currentEthPrice,
            ,
            ,
            
        ) = ethUsdPriceFeed.latestRoundData();
        
        uint256 storedPrice = latestPriceData.ethUsdPrice;
        uint256 currentPrice = uint256(currentEthPrice);
        
        uint256 deviation = storedPrice > currentPrice 
            ? ((storedPrice - currentPrice) * 100) / storedPrice
            : ((currentPrice - storedPrice) * 100) / storedPrice;
            
        return deviation >= PRICE_DEVIATION_THRESHOLD;
    }

    receive() external payable {}
}