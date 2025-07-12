import React from 'react';

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12',
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 w-full h-full"></div>
    </div>
  );
};

export default LoadingSpinner;