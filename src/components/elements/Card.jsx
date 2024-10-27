import React from 'react';

const Card = ({ children, className = '' }) => {
  const baseStyles = 'bg-white rounded-lg border shadow-sm';
  
  return (
    <div className={`${baseStyles} ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => {
  const baseStyles = 'p-6 pb-4';
  
  return (
    <div className={`${baseStyles} ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '' }) => {
  const baseStyles = 'text-lg font-semibold leading-none tracking-tight';
  
  return (
    <h3 className={`${baseStyles} ${className}`}>
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '' }) => {
  const baseStyles = 'p-6 pt-0';
  
  return (
    <div className={`${baseStyles} ${className}`}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent };