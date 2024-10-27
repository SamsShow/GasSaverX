import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { EthereumProvider } from './context/EthereumContext';
import Layout from './components/layout/layout';
import Navbar from './components/layout/Navbar';
import GasMetrics from './components/gas/GasMetrics';
import OptimizeGas from './components/gas/OptimizeGas';
import PriceFeeds from './components/gas/PriceFeeds';
import TransactionForm from './components/transaction/TransactionForm';
import TransactionHistory from './components/transaction/TransactionHistory';

const App = () => {
  return (
    <EthereumProvider>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <Layout>
          <div className="container mx-auto px-4 py-8">
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
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

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Execute Transaction
                  </h2>
                  <TransactionForm />
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Transaction History
                  </h2>
                  <TransactionHistory />
                </div>
              </div>
            </div>

            {/* Footer Information */}
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
          </div>
        </Layout>

        {/* Toast Container for Notifications */}
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
    </EthereumProvider>
  );
};

export default App;