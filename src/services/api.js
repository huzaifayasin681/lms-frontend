import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:6543/api';

// Create axios instance with authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
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
      console.error('Server error:', error.response?.data);
      window.dispatchEvent(new CustomEvent('server-error', { detail: error }));
    }
    
    return Promise.reject(error);
  }
);

class ApiService {
  // Course API methods
  async getCourses(params = {}) {
    try {
      const response = await apiClient.get('/courses', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCourse(courseId) {
    try {
      const response = await apiClient.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCourse(courseData) {
    try {
      const response = await apiClient.post('/courses', courseData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCourse(courseId, courseData) {
    try {
      const response = await apiClient.put(`/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCourse(courseId) {
    try {
      const response = await apiClient.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async syncCourses(lmsType) {
    try {
      const response = await apiClient.post('/courses/sync', {
        lms_type: lmsType
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Content API methods
  async getCourseContent(courseId, params = {}) {
    try {
      const response = await apiClient.get(`/courses/${courseId}/content`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
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
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
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
    try {
      const response = await apiClient.get(`/content/${contentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateContentItem(contentId, contentData) {
    try {
      const response = await apiClient.put(`/content/${contentId}`, contentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteContentItem(contentId) {
    try {
      const response = await apiClient.delete(`/content/${contentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getContentFileUrl(contentId) {
    return `${API_BASE_URL}/content/${contentId}/file`;
  }

  async searchContent(params = {}) {
    try {
      const response = await apiClient.get('/content/search', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async moodleLogin(username, password) {
    try {
      const response = await apiClient.post('/moodle/login', {
        username,
        password
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    console.error('API Error:', error);
    
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