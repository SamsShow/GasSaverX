import React from 'react';
import { FaGasPump } from 'react-icons/fa';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaGasPump className="text-blue-600 text-2xl" />
              <span className="text-xl font-bold text-gray-800">GasSaverX</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Home</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <FaGasPump className="text-blue-600 text-xl mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">GasSaverX</h3>
          </div>
          <p className="text-gray-600 mb-4">Optimizing your blockchain transactions</p>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} GasSaverX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;