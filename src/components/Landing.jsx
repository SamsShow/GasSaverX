import React from 'react';
import { motion } from 'framer-motion';
import { FaEthereum, FaRocket, FaWallet } from 'react-icons/fa';
import { BsLightningCharge, BsGraphUp } from 'react-icons/bs';
import { Typewriter } from 'react-simple-typewriter';
import { Parallax } from 'react-parallax';
import { Tilt } from 'react-tilt';
import 'aos/dist/aos.css';
import logo from '../assets/logo.svg';

const LandingPage = () => {
  return (
    <div className="bg-gradient-to-br from-[#F2F9FF] to-[#FFFFFF] text-gray-800 font-sans overflow-hidden">
      {/* Hero Section with Parallax */}
        <Parallax
          blur={0}
          bgImage="/path/to/blockchain-bg.jpg"
          bgImageAlt="blockchain"
          strength={200}
        >
          
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1.2 }}
            className="relative"
          >
            <div className="flex flex-col items-center py-32 px-8 bg-[#EBF6FF]/90 backdrop-blur-sm">
          {/* Added Logo */}
          <motion.img
            src={logo}
            alt="GasSaverX Logo"
            className="w-48 mb-8"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 text-center bg-gradient-to-r from-[#4B6E91] to-[#00D1B2] text-transparent bg-clip-text"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, type: "spring", bounce: 0.5 }}
          >
            <Typewriter
              words={['Revolutionize', 'Optimize', 'Transform', 'Accelerate']}
              loop={true}
              cursor
              cursorStyle='|'
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1000}
            />
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <br />
              Your Blockchain Transactions
            </motion.span>
          </motion.h1>

          <Tilt options={{ max: 25, scale: 1.05 }}>
            <motion.div 
              className="glass-card p-8 rounded-xl mb-8"
              whileHover={{ scale: 1.02 }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-xl mb-4 max-w-3xl text-center text-[#7B95B4]">
            With GasSaverX - Secure and Efficient Blockchain Solutions
              </p>
              <p className="text-[#7B95B4] max-w-xl text-center">
            GasSaverX optimizes Ethereum and EVM-compatible blockchain transactions with real-time gas price analytics, 
            intelligent optimization, and seamless execution.
              </p>
            </motion.div>
          </Tilt>

          <motion.div 
            className="flex gap-4"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(0,209,178,0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#00D1B2] to-[#00B8A3] text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300"
            >
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#F2F9FF" }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-[#4B6E91] font-bold py-4 px-8 rounded-full shadow-lg border-2 border-[#00D1B2] transition-all duration-300"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute right-10 top-20"
            >
              <FaEthereum className="text-6xl text-[#00D1B2] opacity-50" />
            </motion.div>
          </div>
        </motion.div>
      </Parallax>
      

      {/* Partners Section */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="flex flex-col items-center py-16 bg-[#F2F9FF]">
          <h2 className="text-2xl font-semibold mb-4 text-[#4B6E91]">Supported Networks</h2>
          <p className="text-[#7B95B4] mb-10">Leading the Way in Blockchain Technology</p>
          <motion.div 
            className="flex justify-center gap-8 flex-wrap"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ staggerChildren: 0.2 }}
          >
            {["src/assets/Ethereum_logo_2014.svg.png", "src/assets/Bitcoin.svg.png", "src/assets/polygon-matic-logo.png", 
              "src/assets/binance-smart-chain.com", "src/assets/arbitrum-arb-logo.png"].map((src, index) => (
              <motion.img
                key={index}
                src={src}
                alt="networks"
                className="w-16 h-16 hover:scale-110 transition-transform duration-300"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0 }} 
        whileInView={{ opacity: 1 }} 
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="py-24 bg-white">
          <h2 className="text-2xl text-center font-semibold mb-12 text-[#4B6E91]">Key Features of GasSaverX</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
            {/* Feature cards are already animated via the FeatureCard component */}
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
              title="Portfolio Dashboard"
              description="Monitor your assets and track your portfolio performance with real-time data through Coinpaprika."
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
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
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