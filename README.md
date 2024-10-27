# GasSaverX

 GasSaverX is a gas fee optimization toolthat helps blockchain users reduce transaction costs through real-time gas fee estimates and optimized transaction routing. With the addition of PYUSD (PayPal USD), users will also be able to interact with and potentially pay transaction fees using a stablecoin, providing further flexibility and cost efficiency.

## Smart Contract

### Features

    Gas Optimization: Automatically calculates and applies the optimal gas price based on network conditions and historical data.

    Gas Metrics: Records gas price data for historical analysis, helping users save gas on future transactions.

    Whitelist: Privileged users can bypass certain restrictions.

    Emergency Withdrawals: Allows the contract owner to withdraw funds in case of emergencies.

    Automation with Chainlink: Ensures real-time price updates and network optimization via Chainlink Automation.

    Priority Fee Adjustments: Adjusts the priority fee based on network congestion.

    Transaction Payments with PYUSD: Allows users to pay gas fees using PayPal USD (PYUSD).

### Directory Structure

```
gas-saver-x/
├── src/
│   ├── config/
│   │   ├── abi.json                 # contract ABI
│   │   └── contractAddress.jsx      # contract address
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx          # Navigation and wallet connection
│   │   │   └── Layout.jsx          # Main layout wrapper
│   │   ├── gas/
│   │   │   ├── GasMetrics.jsx      # Gas price statistics
│   │   │   ├── OptimizeGas.jsx     # Gas optimization interface
│   │   │   └── PriceFeeds.jsx      # Price feed display
│   │   └── transaction/
│   │       ├── TransactionForm.jsx  # Transaction execution form
│   │       └── TransactionHistory.jsx # Past transactions
│   ├── hooks/
│   │   ├── useEthereum.js          # Ethereum connection logic
│   │   └── useGasSaver.js          # Contract interaction logic
│   ├── context/
│   │   └── EthereumContext.jsx     # Ethereum state management
│   ├── utils/
│   │   └── helpers.js              # Utility functions
│   ├── App.jsx
│   └── index.js
└── package.json
```
