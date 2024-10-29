import React, { useState, useEffect } from 'react';
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
  return parseFloat(ethers.formatEther(value)).toFixed(4);
};

const TransactionHistory = ({ provider, userAddress }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!provider || !userAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get the latest block number
        const currentBlock = await provider.getBlockNumber();
        const txs = [];

        // Fetch last 10 blocks (adjust number as needed)
        for (let i = 0; i < 10; i++) {
          const block = await provider.getBlock(currentBlock - i, true);
          if (!block || !block.transactions) continue;

          // Filter transactions involving the user's address
          const relevantTxs = block.transactions.filter(tx => 
            tx.from?.toLowerCase() === userAddress.toLowerCase() ||
            tx.to?.toLowerCase() === userAddress.toLowerCase()
          );

          // Get details for each relevant transaction
          for (const tx of relevantTxs) {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            
            txs.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              status: receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending',
              timestamp: block.timestamp
            });
          }
        }

        setTransactions(txs);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [provider, userAddress]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
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
                <div className="flex flex-col">
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