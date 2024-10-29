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
├── .env.local                    # Environment variables (API keys, RPC URLs, contract addresses)
├── .gitattributes                # Git attributes configuration
├── .gitignore                    # Files and directories to ignore in Git
├── eslint.config.js              # ESLint configuration for code quality
├── index.html                    # Main HTML file entry point for the app
├── package-lock.json             # Auto-generated lockfile for installed npm packages
├── package.json                  # Project dependencies and npm scripts
├── postcss.config.js             # PostCSS configuration for Tailwind CSS processing
├── public/                       # Publicly accessible files and assets
│   └── favicon.svg               # Favicon for the application
├── src/                          # Core application logic
│   ├── App.jsx                   # Main app component
│   ├── assets/                   # Static assets (logos, images, etc.)
│   │   └── logo.svg              # App logo
│   ├── components/               # Reusable UI components
│   │   ├── layout/               # Layout components (e.g., Navbar, Footer)
│   │   │   ├── Navbar.jsx        # Navigation bar with wallet connection
│   │   │   └── Layout.jsx        # Layout wrapper for the application
│   │   ├── gas/                  # Components related to gas metrics and optimization
│   │   │   ├── GasMetrics.jsx    # Gas price statistics display component
│   │   │   ├── OptimizeGas.jsx   # Gas optimization feature
│   │   │   └── PriceFeeds.jsx    # Price feed data from Chainlink
│   │   │   └── RealTimeAnalysis.jsx
│   │   └── transaction/          # Components related to transaction execution and history
│   │       ├── TransactionForm.jsx   # Form to execute transactions
│   │       └── TransactionHistory.jsx # Displays the transaction history
│   ├── config/                   # Configuration files for blockchain interaction
│   │   ├── abi.js                # ABI (Application Binary Interface) for interacting with the smart contract
│   │   └── contractAddress.js    # Smart contract address for deployment
│   ├── context/                  # React Context for managing state
│   │   └── EthereumContext.jsx   # Context for wallet connection and Ethereum-related states
│   ├── hooks/                    # Custom React hooks for Web3 functionality
│   │   └── useEthereum.js        # Hook to handle wallet connection and blockchain interactions
│   │   └── useGasSaver.js        # Hook to optimize gas usage in transactions
│   │   └── useQuickNode.js
│   ├── services/  
│   │   └── odosService.js 
│   │   └── WebhookService.js 
│   ├── main.jsx                  # Main entry point for React app
│   ├── styles/                   # Global and component-specific styles
│   │   └── index.css             # Tailwind CSS global styles
│   └── utils/                    # Utility functions for various app functionalities
│       └── helpers.js            # Helper functions (formatting, validation)
├── tailwind.config.js            # Tailwind CSS configuration
└── vite.config.js                # Vite.js build and development configuration
```
