import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:1234/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      this.token = token;
      
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  }

  async register(username, email, password) {
    try {
      console.log('Registration attempt:', { username, email, API_BASE_URL });
      console.log('Making request to:', `${API_BASE_URL}/auth/register`);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Registration response status:', response.status);
      console.log('Registration response data:', response.data);
      console.log('Registration response headers:', response.headers);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response format: missing token or user data');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      this.token = token;
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Handle different types of errors
      let errorMessage = 'Registration failed';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (error.response) {
        // Server responded with error
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid registration data provided';
        } else if (error.response.status === 409) {
          errorMessage = 'Username or email already exists';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  setToken(token) {
    localStorage.setItem('token', token);
    this.token = token;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  isAdmin() {
    const user = this.getUser();
    return user?.is_admin || false;
  }
}

export default new AuthService();