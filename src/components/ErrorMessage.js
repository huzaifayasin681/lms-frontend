import React, { useState } from 'react';
import { ErrorHandler } from '../utils/errorHandler';

const ErrorMessage = ({ 
  error, 
  onRetry = null, 
  onDismiss = null,
  showDetails = false,
  className = ''
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);

  if (!error) {
    return null;
  }

  const userMessage = ErrorHandler.getUserFriendlyMessage(error);
  const canRetry = onRetry && ErrorHandler.shouldRetry(error);

  const getErrorIcon = () => {
    if (error.code === 'NETWORK_ERROR') return '🌐';
    if (error.code === 'AUTH_ERROR') return '🔒';
    if (error.code === 'VALIDATION_ERROR') return '⚠️';
    return '❌';
  };

  const getErrorTypeClass = () => {
    if (error.code === 'VALIDATION_ERROR') return 'error-warning';
    if (error.code === 'AUTH_ERROR') return 'error-auth';
    if (error.code === 'NETWORK_ERROR') return 'error-network';
    return 'error-general';
  };

  return (
    <div className={`error-message ${getErrorTypeClass()} ${className}`}>
      <div className="error-content">
        <div className="error-header">
          <span className="error-icon">{getErrorIcon()}</span>
          <div className="error-text">
            <div className="error-title">
              {error.code === 'NETWORK_ERROR' ? 'Connection Problem' :
               error.code === 'AUTH_ERROR' ? 'Authentication Required' :
               error.code === 'VALIDATION_ERROR' ? 'Input Error' :
               'Error'}
            </div>
            <div className="error-description">{userMessage}</div>
          </div>
        </div>

        {(showDetails && error.details && Object.keys(error.details).length > 0) && (
          <div className="error-details-section">
            <button 
              className="error-details-toggle"
              onClick={() => setDetailsVisible(!detailsVisible)}
            >
              {detailsVisible ? 'Hide Details' : 'Show Details'}
            </button>
            
            {detailsVisible && (
              <div className="error-details">
                <div><strong>Error Code:</strong> {error.code}</div>
                {error.timestamp && (
                  <div><strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}</div>
                )}
                {error.details && (
                  <div>
                    <strong>Details:</strong>
                    <pre>{JSON.stringify(error.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="error-actions">
          {canRetry && (
            <button 
              onClick={onRetry}
              className="btn btn-primary btn-sm"
            >
              Try Again
            </button>
          )}
          
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="btn btn-secondary btn-sm"
            >
              Dismiss
            </button>
          )}
          
          {error.code === 'AUTH_ERROR' && (
            <button 
              onClick={() => window.location.href = '/login'}
              className="btn btn-primary btn-sm"
            >
              Log In
            </button>
          )}
          
          {error.code === 'NETWORK_ERROR' && (
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-secondary btn-sm"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for displaying field-specific validation errors
const FieldErrorMessage = ({ errors, fieldName }) => {
  if (!errors || !errors[fieldName] || errors[fieldName].length === 0) {
    return null;
  }

  return (
    <div className="field-error-message">
      {errors[fieldName].map((error, index) => (
        <div key={index} className="field-error">
          <span className="field-error-icon">⚠️</span>
          <span className="field-error-text">{error}</span>
        </div>
      ))}
    </div>
  );
};

// Component for displaying success messages
const SuccessMessage = ({ 
  message, 
  onDismiss = null,
  autoHide = true,
  duration = 5000,
  className = ''
}) => {
  const [visible, setVisible] = useState(true);

  React.useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  if (!visible || !message) {
    return null;
  }

  return (
    <div className={`success-message ${className}`}>
      <div className="success-content">
        <span className="success-icon">✅</span>
        <div className="success-text">{message}</div>
        {onDismiss && (
          <button 
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="success-close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export { ErrorMessage, FieldErrorMessage, SuccessMessage };
export default ErrorMessage;