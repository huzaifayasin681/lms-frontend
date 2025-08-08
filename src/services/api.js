import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://172.16.10.146:6543/api';

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

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 
                     error.response.data?.error ||
                     `HTTP ${error.response.status}: ${error.response.statusText}`;
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error - please check your connection');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new ApiService();