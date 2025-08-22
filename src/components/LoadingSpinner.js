import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false,
  className = '' 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'spinner-sm';
      case 'large':
        return 'spinner-lg';
      default:
        return 'spinner-md';
    }
  };

  const spinnerContent = (
    <div className={`loading-spinner ${getSizeClass()} ${className}`}>
      <div className="spinner"></div>
      {message && <div className="spinner-message">{message}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;