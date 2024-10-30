import React from 'react';
import { motion } from 'framer-motion';
import { FaEthereum, FaRocket, FaWallet } from 'react-icons/fa';
import { BsLightningCharge, BsGraphUp } from 'react-icons/bs';

const LandingPage = () => {
  return (
    <div className="bg-gradient-to-br from-[#F2F9FF] to-[#FFFFFF] text-gray-800 font-sans">
      {/* Hero Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col items-center py-24 px-8 bg-[#EBF6FF] text-[#4B6E91]">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Revolutionize Your Blockchain Transactions
          </h1>
          <p className="text-xl mb-8 max-w-3xl text-center text-[#7B95B4]">
            With GasSaverX - Secure and Efficient Blockchain Solutions
          </p>
          <p className="text-[#7B95B4] mb-10 max-w-xl text-center">
            GasSaverX optimizes Ethereum and EVM-compatible blockchain transactions with real-time gas price analytics, intelligent optimization, and seamless execution.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#00D1B2] hover:bg-[#00B8A3] text-white font-bold py-3 px-8 rounded-full shadow-lg"
          >
            Get Started
          </motion.button>
        </div>
      </motion.div>

      {/* Partners Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="flex flex-col items-center py-16 bg-[#F2F9FF]">
          <h2 className="text-2xl font-semibold mb-4 text-[#4B6E91]">Our Partners</h2>
          <p className="text-[#7B95B4] mb-10">Leading the Way in Blockchain Technology</p>
          <div className="flex justify-center gap-8 flex-wrap">
            <img src="/path/to/ethereum-logo.png" alt="Ethereum" className="w-16 h-16" />
            <img src="/path/to/polygon-logo.png" alt="Polygon" className="w-16 h-16" />
            <img src="/path/to/arbitrum-logo.png" alt="Arbitrum" className="w-16 h-16" />
            <img src="/path/to/optimism-logo.png" alt="Optimism" className="w-16 h-16" />
            <img src="/path/to/chainlink-logo.png" alt="Chainlink" className="w-16 h-16" />
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <div className="py-24 bg-white">
          <h2 className="text-2xl text-center font-semibold mb-12 text-[#4B6E91]">Key Features of GasSaverX</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
            <FeatureCard
              icon={<FaRocket className="text-[#00D1B2]" />}
              title="Real-Time Gas Analytics"
              description="Track gas prices, base fees, and priority fees in real-time across Ethereum, Polygon, and Arbitrum."
            />
            <FeatureCard
              icon={<BsLightningCharge className="text-[#00D1B2]" />}
              title="Gas Optimization"
              description="Utilize the Odos API to find optimal transaction routes and calculate potential gas savings."
            />
            <FeatureCard
              icon={<FaWallet className="text-[#00D1B2]" />}
              title="Multi-Chain Support"
              description="Seamlessly execute transactions on Ethereum and other EVM-compatible networks."
            />
            <FeatureCard
              icon={<FaEthereum className="text-[#00D1B2]" />}
              title="PYUSD Support"
              description="Pay for gas fees using PYUSD (PayPal USD) as an alternative to Ether."
            />
            <FeatureCard
              icon={<BsGraphUp className="text-[#00D1B2]" />}
              title="Transaction History"
              description="View a detailed history of your past transactions, including gas savings."
            />
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}>
        <div className="py-24 bg-[#F2F9FF] px-8">
          <h2 className="text-2xl text-center font-semibold mb-12 text-[#4B6E91]">Have Questions? We've Got Answers.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FaqCard
              title="What is GasSaverX?"
              description="GasSaverX is a decentralized app (dApp) to reduce transaction costs by optimizing gas fees on Ethereum and EVM-compatible blockchains."
            />
            <FaqCard
              title="How do I get started with GaSSaverX?"
              description="To start using GasSaverX, connect your Ethereum wallet (e.g., MetaMask) to access gas optimization and transaction history."
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    transition={{ duration: 0.3 }}
    className="p-6 bg-white rounded-lg shadow-lg text-center border border-[#E5F0FF]"
  >
    <div className="text-[#00D1B2] text-4xl mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-[#4B6E91]">{title}</h3>
    <p className="text-[#7B95B4]">{description}</p>
  </motion.div>
);

const FaqCard = ({ title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    transition={{ duration: 0.3 }}
    className="p-6 bg-white rounded-lg shadow-md border border-[#E5F0FF]"
  >
    <h3 className="text-lg font-semibold mb-2 text-[#4B6E91]">{title}</h3>
    <p className="text-[#7B95B4]">{description}</p>
  </motion.div>
);

export default LandingPage;