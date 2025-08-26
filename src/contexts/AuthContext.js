import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AuthService from '../services/auth';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload.error,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: AuthService.isAuthenticated(),
  user: AuthService.getUser(),
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is already authenticated on app start
    if (AuthService.isAuthenticated()) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: AuthService.getUser() },
      });
    }
  }, []);

  const login = async (username, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    const result = await AuthService.login(username, password);
    
    if (result.success) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: result.user },
      });
      return { success: true };
    } else {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: { error: result.error },
      });
      return { success: false, error: result.error };
    }
  };

  const register = async (username, email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    const result = await AuthService.register(username, email, password);
    
    if (result.success) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: result.user },
      });
      return { success: true };
    } else {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: { error: result.error },
      });
      return { success: false, error: result.error };
    }
  };

  const loginWithToken = (token, user) => {
    AuthService.setToken(token);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user },
    });
  };

  const logout = () => {
    AuthService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    loginWithToken,
    logout,
    clearError,
    isAdmin: () => AuthService.isAdmin(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};