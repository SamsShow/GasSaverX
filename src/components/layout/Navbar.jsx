import React from 'react';
import { useEthereum } from '../../context/EthereumContext';
import { shortenAddress } from '../../utils/helpers';

export default function Navbar() {
  const { account, connectWallet, disconnectWallet, isConnecting, error } = useEthereum();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">GasSaverX</div>
        
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
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Connecting...</span>
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
}