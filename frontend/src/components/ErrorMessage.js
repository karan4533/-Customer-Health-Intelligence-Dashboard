import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`error-container ${className}`}>
      <div className="error-card">
        <div className="error-icon">
          <AlertTriangle size={24} />
        </div>
        <h3 className="error-title">Something went wrong</h3>
        <p className="error-message">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="error-retry-btn inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;