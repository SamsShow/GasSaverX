import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEthereum } from '../../context/EthereumContext';
import { shortenAddress } from '../../utils/helpers';

const Navbar = () => {
  const { 
    account, 
    connectWallet, 
    disconnectWallet, 
    isConnecting, 
    error,
    isInitialized 
  } = useEthereum();
  
  const location = useLocation();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Error in handleConnect:', err);
    }
  };

  const navLinks = [
    { path: '/gas', label: 'Gas Analytics' },
    { path: '/portfolio', label: 'Portfolio' },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold">GasSaverX</Link>
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === path
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {account ? (
            <div className="flex items-center gap-2">
              <div className="bg-gray-700 px-4 py-2 rounded-lg">
                {shortenAddress(account)}
              </div>
              <button
                onClick={disconnectWallet}
                className="text-gray-400 hover:text-white px-2 py-1 rounded-lg text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting || !isInitialized}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Connecting...</span>
                </>
              ) : !isInitialized ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Initializing...</span>
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;