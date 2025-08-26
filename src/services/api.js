import axios from 'axios';

// Auto-detect environment and set appropriate API URL
const getApiBaseUrl = () => {
  // If explicitly set in env, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Auto-detect based on current location
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:6543/api';
  } else if (hostname === 'jhbnet.ddns.net') {
    return 'http://jhbnet.ddns.net:46543/api';
  } else {
    // For production, use the same origin with /api
    return `${window.location.protocol}//${window.location.host}/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging for API configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('=== API Configuration Debug ===');
  console.log('REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL);
  console.log('Final API_BASE_URL:', API_BASE_URL);
  console.log('Current window location:', window.location.origin);
  console.log('================================');
}

// Create axios instance with authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token and validate authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Check if this is a protected route that requires authentication
    const protectedRoutes = ['/courses', '/content', '/moodle', '/auth/register'];
    const isProtectedRoute = protectedRoutes.some(route => config.url?.includes(route));
    const isLoginRoute = config.url?.includes('/auth/login') || config.url?.includes('/moodle/login');
    
    if (isProtectedRoute && !isLoginRoute && !token) {
      return Promise.reject(new Error('Authentication required'));
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Global error handling
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('Authentication failed, clearing token');
      localStorage.removeItem('token');
      // Could dispatch an event here to notify components
      window.dispatchEvent(new CustomEvent('auth-error', { detail: error }));
    } else if (error.response?.status >= 500) {
      // Server error
      if (process.env.NODE_ENV === 'development') {
        console.error('Server error:', error.response?.data);
      }
      window.dispatchEvent(new CustomEvent('server-error', { detail: error }));
    }
    
    return Promise.reject(error);
  }
);

class ApiService {
  // Helper method to reduce code duplication
  async _makeRequest(method, url, data = null, config = {}) {
    try {
      const response = method === 'get' 
        ? await apiClient.get(url, config)
        : await apiClient[method](url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Course API methods
  async getCourses(params = {}) {
    return this._makeRequest('get', '/courses', null, { params });
  }

  async getCourse(courseId) {
    return this._makeRequest('get', `/courses/${courseId}`);
  }

  async createCourse(courseData) {
    return this._makeRequest('post', '/courses', courseData);
  }

  async updateCourse(courseId, courseData) {
    return this._makeRequest('put', `/courses/${courseId}`, courseData);
  }

  async deleteCourse(courseId) {
    return this._makeRequest('delete', `/courses/${courseId}`);
  }

  async syncCourses(lmsType) {
    return this._makeRequest('post', '/courses/sync', { lms_type: lmsType });
  }

  async healthCheck() {
    return this._makeRequest('get', '/health');
  }

  // Content API methods
  async getCourseContent(courseId, params = {}) {
    return this._makeRequest('get', `/courses/${courseId}/content`, null, { params });
  }

  async uploadContent(courseId, contentData, onUploadProgress = null) {
    try {
      const config = {
        headers: {
          'Content-Type': contentData instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
      };

      if (onUploadProgress) {
        config.onUploadProgress = (progressEvent) => {
          if (progressEvent.total > 0) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(progress);
          }
        };
      }

      const response = await apiClient.post(
        `/courses/${courseId}/content/upload`, 
        contentData,
        config
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getContentItem(contentId) {
    return this._makeRequest('get', `/content/${contentId}`);
  }

  async updateContentItem(contentId, contentData) {
    return this._makeRequest('put', `/content/${contentId}`, contentData);
  }

  async deleteContentItem(contentId) {
    return this._makeRequest('delete', `/content/${contentId}`);
  }

  getContentFileUrl(contentId) {
    return `${API_BASE_URL}/content/${contentId}/file`;
  }

  async searchContent(params = {}) {
    return this._makeRequest('get', '/content/search', null, { params });
  }

  async moodleLogin(username, password) {
    return this._makeRequest('post', '/moodle/login', { username, password });
  }

  handleError(error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      
      // Handle structured error responses
      if (errorData && typeof errorData === 'object' && errorData.error) {
        // Structured error from backend
        const errorInfo = {
          message: errorData.message || 'An error occurred',
          code: errorData.error_code || 'UNKNOWN_ERROR',
          details: errorData.details || {},
          timestamp: errorData.timestamp,
          status: error.response.status
        };
        
        const enhancedError = new Error(errorInfo.message);
        enhancedError.code = errorInfo.code;
        enhancedError.details = errorInfo.details;
        enhancedError.timestamp = errorInfo.timestamp;
        enhancedError.status = errorInfo.status;
        
        return enhancedError;
      } else {
        // Legacy error format
        const message = errorData?.message || 
                       errorData?.error ||
                       `HTTP ${error.response.status}: ${error.response.statusText}`;
        
        const enhancedError = new Error(message);
        enhancedError.status = error.response.status;
        enhancedError.code = `HTTP_${error.response.status}`;
        
        return enhancedError;
      }
    } else if (error.request) {
      // Request was made but no response received
      const networkError = new Error('Network error - please check your connection');
      networkError.code = 'NETWORK_ERROR';
      networkError.isNetworkError = true;
      return networkError;
    } else {
      // Something else happened
      const unexpectedError = new Error(error.message || 'An unexpected error occurred');
      unexpectedError.code = 'UNEXPECTED_ERROR';
      return unexpectedError;
    }
  }
}

export default new ApiService();