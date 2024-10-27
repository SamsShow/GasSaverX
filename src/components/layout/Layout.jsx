import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>GasSaverX - Optimizing your blockchain transactions</p>
          <p className="mt-2">© {new Date().getFullYear()} GasSaverX. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default Layout;