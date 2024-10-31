import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEthereum } from "react-icons/fa";
import { HiOutlineChartBar } from "react-icons/hi";
import { BiFolderOpen } from "react-icons/bi";
import { Link, useLocation } from "react-router-dom";
import { useEthereum } from "../../context/EthereumContext";
import { shortenAddress } from "../../utils/helpers";
import logo from "../../assets/logo.svg";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    account,
    connectWallet,
    disconnectWallet,
    isConnecting,
    error,
    isInitialized,
  } = useEthereum();

  const location = useLocation();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error("Error in handleConnect:", err);
    }
  };

  const navLinks = [
    { path: "/gas", label: "Gas Analytics" },
    { path: "/portfolio", label: "Portfolio" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="fixed top-0 left-0 right-0 bg-gray-800/80 backdrop-blur-md text-white p-4 z-50"
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.div
          className="flex items-center gap-6"
          whileHover={{ scale: 1.05 }}
        >
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <img src={logo} alt="logo" className="h-8 w-8" />
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              GasSaverX
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {navLinks.map(({ path, label }) => (
              <motion.div
                key={path}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    location.pathname === path
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  {label === "Gas Analytics" ? (
                    <HiOutlineChartBar className="text-lg" />
                  ) : (
                    <BiFolderOpen className="text-lg" />
                  )}
                  {label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-red-400 text-sm px-4 py-2 bg-red-500/10 rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="flex items-center gap-4"
          whileHover={{ scale: 1.02 }}
        >
          {account ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {shortenAddress(account)}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                onClick={disconnectWallet}
              >
                Disconnect
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
              onClick={handleConnect}
              disabled={isConnecting || !isInitialized}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
