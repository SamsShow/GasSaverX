import React from 'react';

const Alert = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = 'p-4 rounded-lg border flex items-start gap-3';
  
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className = '' }) => (
  <h5 className={`font-medium ${className}`}>{children}</h5>
);

const AlertDescription = ({ children, className = '' }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);

export { Alert, AlertTitle, AlertDescription };