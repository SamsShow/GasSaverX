import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ArrowUpRight, ExternalLink, Filter } from 'lucide-react';
import { useEthereum } from '../../context/EthereumContext';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';

// Format helpers
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const formatEther = (value) => {
  if (!value) return '0';
  return parseFloat(ethers.formatEther(value)).toFixed(4);
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const { account, provider, isConnected } = useEthereum();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isConnected || !provider || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the last 100 blocks
        const currentBlock = await provider.getBlockNumber();
        const txs = [];

        for (let i = 0; i < 100; i++) {
          const block = await provider.getBlock(currentBlock - i, true);
          if (!block) continue;

          const relevantTxs = block.transactions.filter(tx => 
            tx.from?.toLowerCase() === account.toLowerCase() ||
            tx.to?.toLowerCase() === account.toLowerCase()
          );

          for (const tx of relevantTxs) {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            
            txs.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              gasSaved: receipt?.gasUsed?.toString() || '0',
              status: receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending',
              timestamp: block.timestamp * 1000
            });
          }
        }

        setTransactions(txs);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [provider, account, isConnected]);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  if (!isConnected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            Please connect your wallet to view transaction history
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Transactions</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From/To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gas Used
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
                {filteredTransactions.map((tx) => (
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
                        {formatEther(tx.value)} ETH
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {ethers.formatUnits(tx.gasSaved, 'gwei')} gwei
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
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;