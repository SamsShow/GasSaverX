import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import { ToastProvider } from "./components/elements/ToastAction";
import "react-toastify/dist/ReactToastify.css";
import { EthereumProvider } from "./context/EthereumContext";
import Layout from "./components/layout/layout";
import Navbar from "./components/layout/Navbar";
import GasMetrics from "./components/gas/GasMetrics";
import OptimizeGas from "./components/gas/OptimizeGas";
import PriceFeeds from "./components/gas/PriceFeeds";
import PortfolioDashboard from "./components/layout/PortfolioDasboard";
import GasOptimizationDashboard from "./components/gas/GasOptimizationDashboard ";
import TransactionForm from "./components/transaction/TransactionForm";
import TransactionHistory from "./components/transaction/TransactionHistory";
import LandingPage from './components/Landing';

// Create separate components for each main view
const GasAnalytics = ({ optimizedGasPrice, setOptimizedGasPrice }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Gas Price Analytics
        </h2>
        <div className="space-y-6">
          <GasMetrics />
          <PriceFeeds />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Gas Optimization
        </h2>
        <OptimizeGas />
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Gas Optimization Dashboard
        </h2>
        <GasOptimizationDashboard
          optimizedGasPrice={optimizedGasPrice}
          onOptimizedGasUpdate={setOptimizedGasPrice}
        />
        <TransactionForm optimizedGasPrice={optimizedGasPrice} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Transaction History
        </h2>
        <TransactionHistory />
      </div>
    </div>
  </div>
);

const PortfolioView = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">
      Portfolio Dashboard
    </h2>
    <PortfolioDashboard />
  </div>
);

const Footer = () => (
  <div className="mt-8 bg-white rounded-lg shadow-md p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          About GasSaverX
        </h3>
        <p className="text-gray-600">
          Optimize your transaction costs with real-time gas fee
          estimates and intelligent routing.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Supported Networks
        </h3>
        <ul className="list-disc list-inside text-gray-600">
          <li>Ethereum Mainnet</li>
          <li>Polygon</li>
          <li>Arbitrum</li>
          <li>Optimism</li>
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Features
        </h3>
        <ul className="list-disc list-inside text-gray-600">
          <li>Real-time gas tracking</li>
          <li>PYUSD integration</li>
          <li>Route optimization</li>
          <li>Historical analytics</li>
        </ul>
      </div>
    </div>
  </div>
);

const App = () => {
  const [optimizedGasPrice, setOptimizedGasPrice] = useState(null);

  return (
    <Router>
      <EthereumProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-100">
            <Navbar />
            <Layout>
              <div className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route 
                    path="/gas" 
                    element={
                      <GasAnalytics 
                        optimizedGasPrice={optimizedGasPrice}
                        setOptimizedGasPrice={setOptimizedGasPrice}
                      />
                    } 
                  />
                  <Route path="/portfolio" element={<PortfolioView />} />
                </Routes>
                <Footer />
              </div>
            </Layout>

            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </ToastProvider>
      </EthereumProvider>
    </Router>
  );
};

export default App;