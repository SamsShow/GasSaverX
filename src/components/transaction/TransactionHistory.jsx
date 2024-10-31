// TransactionHistory.jsx
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';

const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const formatEther = (value) => {
  if (!value) return '0';
  try {
    return parseFloat(ethers.formatEther(value)).toFixed(4);
  } catch (error) {
    console.error('Error formatting ether value:', error);
    return '0';
  }
};

const TransactionHistory = ({ transactions = [], className = '' }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 rounded-lg border border-gray-200 bg-gray-50">
        No transactions found. Make a transaction to see it appear here.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hash
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              From/To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount (ETH)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => (
            <tr key={tx.hash} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">
                    {formatAddress(tx.hash)}
                  </span>
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-900">
                    From: {formatAddress(tx.from)}
                  </span>
                  <span className="text-sm text-gray-900">
                    To: {formatAddress(tx.to)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {formatEther(tx.value)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${tx.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                  ${tx.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                  ${tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}`}
                >
                  {tx.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTimestamp(tx.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;