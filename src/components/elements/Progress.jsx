import React from 'react';
import { motion } from 'framer-motion';

export const Progress = ({ value = 0, className = '', max = 100 }) => {
  // Ensure value is between 0 and max
  const normalizedValue = Math.min(Math.max(0, value), max);
  const percentage = (normalizedValue / max) * 100;

  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}>
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
};

export const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'animate-pulse rounded-md bg-gray-200';
  
  const variants = {
    default: '',
    circle: 'rounded-full',
    text: 'h-4',
  };

  return (
    <motion.div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ 
        opacity: [0.5, 0.8, 0.5],
        transition: {
          duration: 1.5,
          repeat: Infinity,
        }
      }}
    />
  );
};

// Example usage of multiple skeleton variants in a card
export const SkeletonCard = () => (
  <div className="space-y-3">
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <div className="flex items-center space-x-4">
      <Skeleton variant="circle" className="h-12 w-12" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </div>
);

// Loading state component using the custom skeletons
export const LoadingState = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-6 bg-white rounded-lg shadow">
          <SkeletonCard />
        </div>
      ))}
    </div>
    <div className="p-6 bg-white rounded-lg shadow">
      <Skeleton className="h-64 w-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 bg-white rounded-lg shadow">
          <SkeletonCard />
        </div>
      ))}
    </div>
  </div>
);

// Example of a metric card using both Progress and Skeleton
export const MetricCard = ({ 
  title, 
  value, 
  progress, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <Progress value={progress} />
    </div>
  );
};