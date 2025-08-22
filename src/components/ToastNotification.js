import React, { useState, useEffect } from 'react';
import { ToastManager } from '../utils/errorHandler';

const ToastNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(notification.id);
    }, 300); // Animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getClassName = () => {
    const baseClass = 'toast-notification';
    const typeClass = `toast-${notification.type}`;
    const exitClass = isExiting ? 'toast-exiting' : '';
    
    return `${baseClass} ${typeClass} ${exitClass}`.trim();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={getClassName()}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <div className="toast-message">
          <div className="toast-title">{notification.title || notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</div>
          <div className="toast-text">{notification.message}</div>
          
          {notification.details && Object.keys(notification.details).length > 0 && (
            <details className="toast-details">
              <summary>Details</summary>
              <pre>{JSON.stringify(notification.details, null, 2)}</pre>
            </details>
          )}
          
          {notification.actions && (
            <div className="toast-actions">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`btn btn-sm ${action.className || 'btn-outline'}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (notification) => {
      if (notification.type === 'remove') {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      } else {
        setNotifications(prev => [...prev, notification]);
      }
    };

    ToastManager.addListener(handleNotification);

    return () => {
      ToastManager.removeListener(handleNotification);
    };
  }, []);

  const handleCloseNotification = (id) => {
    ToastManager.remove(id);
  };

  return (
    <div className="toast-container">
      {notifications.map(notification => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onClose={handleCloseNotification}
        />
      ))}
    </div>
  );
};

export { ToastNotification, ToastContainer };
export default ToastContainer;