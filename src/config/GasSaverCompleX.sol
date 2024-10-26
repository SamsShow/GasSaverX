// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title GasSaverX
 * @dev Contract for optimizing gas fees with Chainlink integration
 */
contract GasSaverX is Ownable, ReentrancyGuard, AutomationCompatible {
    // Chainlink Price Feed interfaces
    AggregatorV3Interface public ethUsdPriceFeed;
    
    // PYUSD token interface
    IERC20 public pyusd;
    
    // Struct to store price data
    struct PriceData {
        uint256 ethUsdPrice;
        uint256 lastUpdate;
    }
    
    // Price data storage
    PriceData public latestPriceData;
    
    // Update interval (1 hour)
    uint256 public constant UPDATE_INTERVAL = 1 hours;
    
    // Threshold for price deviation (5%)
    uint256 public constant PRICE_DEVIATION_THRESHOLD = 5;
    
    // Events
    event PricesUpdated(uint256 ethUsdPrice, uint256 timestamp);
    event GasOptimizationTriggered(address indexed user, uint256 savedGas);
    
    constructor(
        address initialOwner,
        address _pyusdAddress,
        address _ethUsdPriceFeed
    ) Ownable(initialOwner) {
        pyusd = IERC20(_pyusdAddress);
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        
        // Initialize price data
        updatePriceData();
    }

    /**
     * @dev Calculates optimal gas price (you can define logic based on other conditions)
     */
    function calculateOptimalGasPrice(uint256 baseGasPrice) 
        public 
        pure 
        returns (uint256) 
    {
        // Add 10% buffer to base gas price for higher probability of inclusion
        return (baseGasPrice * 110) / 100;
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
     * @dev Estimates gas cost in PYUSD
     */
    function estimateGasCostInPyusd(uint256 gasLimit) public view returns (uint256) {
        uint256 gasCostInEth = gasLimit * tx.gasprice;
        return convertEthToPyusd(gasCostInEth);
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
    
    /**
     * @dev Executes an optimized transaction
     */
    function executeOptimizedTransaction(
        address to,
        bytes calldata data,
        uint256 value
    ) external payable nonReentrant {
        // Get initial gas estimation
        uint256 initialGas = gasleft();
        
        // Calculate gas limit for the actual transaction
        uint256 gasLimit = initialGas - 50000; // Reserve some gas for the rest of this function
        
        // Get optimized gas data
        (uint256 optimizedGasPrice, uint256 estimatedCost) = optimizeGasUsage(
            to,
            data,
            gasLimit
        );
        
        // Handle payment (ETH or PYUSD)
        if (msg.value > 0) {
            require(msg.value >= estimatedCost, "Insufficient ETH");
        } else {
            uint256 pyusdCost = convertEthToPyusd(estimatedCost);
            require(
                pyusd.transferFrom(msg.sender, address(this), pyusdCost),
                "PYUSD transfer failed"
            );
        }
        
        // Execute transaction
        (bool success, ) = to.call{value: value, gas: gasLimit}(data);
        require(success, "Transaction failed");
        
        // Calculate actual gas used and refund excess
        uint256 gasUsed = initialGas - gasleft();
        uint256 actualCost = gasUsed * optimizedGasPrice;
        
        if (msg.value > 0 && msg.value > actualCost) {
            payable(msg.sender).transfer(msg.value - actualCost);
        }
        
        emit GasOptimizationTriggered(msg.sender, gasLimit - gasUsed);
    }
    
    receive() external payable {}
}
