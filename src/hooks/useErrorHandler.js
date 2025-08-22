import { useCallback, useState } from 'react';
import { ErrorHandler, ToastManager } from '../utils/errorHandler';

// Custom hook for handling errors in components
export const useErrorHandler = (context = '') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleError = useCallback((error, showToast = true) => {
    const errorInfo = ErrorHandler.handleApiError(error, context);
    setError(errorInfo);

    if (showToast) {
      const userMessage = ErrorHandler.getUserFriendlyMessage(error);
      ToastManager.error(userMessage, {
        details: error.details,
        actions: ErrorHandler.shouldRetry(error) ? [{
          label: 'Retry',
          onClick: () => {
            // This would need to be implemented by the component
            console.log('Retry clicked for error:', error.code);
          },
          className: 'btn-primary'
        }] : undefined
      });
    }

    return errorInfo;
  }, [context]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeWithErrorHandling = useCallback(async (operation, showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      clearError();
      
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error);
      throw error; // Re-throw so component can handle if needed
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [handleError, clearError]);

  const retryOperation = useCallback(async (operation, maxAttempts = 3) => {
    try {
      setLoading(true);
      clearError();
      
      const result = await ErrorHandler.retryOperation(operation, maxAttempts, context);
      ToastManager.success('Operation completed successfully');
      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, context]);

  return {
    loading,
    error,
    handleError,
    clearError,
    executeWithErrorHandling,
    retryOperation
  };
};

// Hook for API operations with built-in error handling
export const useApiOperation = (operation, dependencies = []) => {
  const { executeWithErrorHandling, ...errorHandlerProps } = useErrorHandler();
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      const result = await executeWithErrorHandling(() => operation(...args));
      setData(result);
      return result;
    } catch (error) {
      // Error already handled by executeWithErrorHandling
      throw error;
    }
  }, [operation, executeWithErrorHandling, ...dependencies]);

  return {
    data,
    execute,
    ...errorHandlerProps
  };
};

// Hook for form validation with error handling
export const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  const validateField = useCallback((name, value, validators = []) => {
    const fieldErrors = [];

    for (const validator of validators) {
      try {
        const result = validator(value);
        if (result !== true) {
          fieldErrors.push(result);
        }
      } catch (error) {
        fieldErrors.push('Validation error occurred');
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors.length > 0 ? fieldErrors : undefined
    }));

    return fieldErrors.length === 0;
  }, []);

  const validateForm = useCallback((formData, validationRules = {}) => {
    const formErrors = {};
    let isValid = true;

    for (const [fieldName, validators] of Object.entries(validationRules)) {
      const value = formData[fieldName];
      const fieldErrors = [];

      for (const validator of validators) {
        try {
          const result = validator(value);
          if (result !== true) {
            fieldErrors.push(result);
          }
        } catch (error) {
          fieldErrors.push('Validation error occurred');
        }
      }

      if (fieldErrors.length > 0) {
        formErrors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    setErrors(formErrors);
    return { isValid, errors: formErrors };
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
};

export default useErrorHandler;