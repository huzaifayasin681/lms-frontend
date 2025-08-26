import apiService from './api';

/**
 * Moodle Integration Service
 * 
 * Provides high-level methods for Moodle integration with error handling
 * and data transformation for the frontend.
 */
class MoodleService {
  constructor() {
    this.isConnected = false;
    this.siteInfo = null;
  }

  /**
   * Test Moodle connection and cache site info
   */
  async testConnection() {
    console.log('🔍 [MOODLE SERVICE] Testing connection...');
    try {
      console.log('🌐 [MOODLE SERVICE] Calling apiService.getMoodleSiteInfo()');
      const response = await apiService.getMoodleSiteInfo();
      
      console.log('📥 [MOODLE SERVICE] API response received:', {
        ok: response.ok,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        error: response.error
      });
      
      if (response.ok && response.data) {
        this.isConnected = true;
        this.siteInfo = response.data;
        
        console.log('✅ [MOODLE SERVICE] Connection successful, site info cached:', {
          sitename: response.data.sitename,
          version: response.data.version,
          functionsCount: response.data.functions?.length
        });
        
        return {
          success: true,
          siteInfo: response.data
        };
      } else {
        this.isConnected = false;
        console.log('❌ [MOODLE SERVICE] Connection failed - no valid response');
        return {
          success: false,
          error: 'Failed to get site info'
        };
      }
    } catch (error) {
      this.isConnected = false;
      console.log('💥 [MOODLE SERVICE] Connection error:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      return {
        success: false,
        error: error.message || 'Connection failed'
      };
    }
  }

  /**
   * Get cached site info or fetch if not available
   */
  async getSiteInfo() {
    if (!this.siteInfo) {
      const result = await this.testConnection();
      if (!result.success) {
        throw new Error(result.error);
      }
    }
    return this.siteInfo;
  }

  /**
   * Get all courses with optional filtering
   */
  async getCourses(filters = {}) {
    console.log('📚 [MOODLE SERVICE] Getting courses with filters:', filters);
    try {
      console.log('🌐 [MOODLE SERVICE] Calling apiService.getMoodleCourses()');
      const response = await apiService.getMoodleCourses(filters);
      
      console.log('📥 [MOODLE SERVICE] Raw API response:', response);
      
      // Handle direct array response or wrapped response
      let coursesData = [];
      if (Array.isArray(response)) {
        coursesData = response;
      } else if (response.ok && Array.isArray(response.data)) {
        coursesData = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        coursesData = response.data;
      }
      
      console.log('📥 [MOODLE SERVICE] Extracted courses data:', {
        count: coursesData.length,
        isArray: Array.isArray(coursesData),
        firstCourse: coursesData[0] || null
      });
      
      const mappedCourses = coursesData.map(course => ({
        id: course.id,
        fullname: course.fullname,
        shortname: course.shortname,
        categoryid: course.categoryid,
        visible: course.visible,
        summary: course.summary || '',
        format: course.format || 'topics',
        startdate: course.startdate ? new Date(course.startdate * 1000) : null,
        enddate: course.enddate ? new Date(course.enddate * 1000) : null,
        enrolledusers: course.enrolledusercount || 0
      }));
      
      console.log('✅ [MOODLE SERVICE] Courses processed:', {
        originalCount: coursesData.length,
        mappedCount: mappedCourses.length,
        sampleCourse: mappedCourses[0] || null
      });
      
      return {
        success: true,
        data: mappedCourses
      };
    } catch (error) {
      console.log('💥 [MOODLE SERVICE] Get courses error:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search courses
   */
  async searchCourses(searchTerm, page = 0, limit = 20) {
    try {
      const response = await apiService.searchMoodleCourses(searchTerm, page, limit);
      if (response.ok) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.error?.message || 'Search failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a course
   */
  async deleteCourse(courseId) {
    try {
      const response = await apiService.deleteMoodleCourse(courseId);
      if (response.ok) {
        return {
          success: true,
          message: response.data?.message || 'Course deleted successfully'
        };
      } else {
        throw new Error(response.error?.message || 'Delete failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get course contents
   */
  async getCourseContents(courseId) {
    try {
      const response = await apiService.getMoodleCourseContents(courseId);
      if (response.ok) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        // Handle 403/permission errors gracefully
        if (response.status === 403) {
          return {
            success: true,
            data: [],
            warning: 'Course contents not accessible - function may not be enabled'
          };
        }
        throw new Error(response.error?.message || 'Failed to get course contents');
      }
    } catch (error) {
      // Handle 403 errors gracefully
      if (error.status === 403) {
        return {
          success: true,
          data: [],
          warning: 'Course contents not accessible - insufficient permissions'
        };
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete course content/module
   */
  async deleteContent(moduleId) {
    try {
      const response = await apiService.deleteMoodleContent(moduleId);
      if (response.ok) {
        return {
          success: true,
          message: response.data?.message || 'Content deleted successfully'
        };
      } else {
        throw new Error(response.error?.message || 'Delete failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate file for upload
   */
  async validateFile(filename, filesize) {
    try {
      const response = await apiService.validateMoodleFile({ filename, filesize });
      return {
        success: response.ok,
        data: response.data,
        error: response.error?.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get instructor dashboard data
   */
  async getInstructorDashboard(userid) {
    try {
      const response = await apiService.getMoodleInstructorDashboard(userid);
      if (response.ok) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.error?.message || 'Failed to get dashboard data');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload file to Moodle
   */
  async uploadFile(formData, onProgress) {
    try {
      const response = await apiService.uploadMoodleFile(formData.get('file'), {
        contextid: formData.get('contextid'),
        component: formData.get('component'),
        filearea: formData.get('filearea'),
        itemid: formData.get('itemid')
      });
      
      if (response.ok) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new course
   */
  async createCourse(courseData) {
    try {
      // Validate required fields
      const required = ['fullname', 'shortname', 'categoryid'];
      for (const field of required) {
        if (!courseData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      const response = await apiService.createMoodleCourse(courseData);
      if (response.ok) {
        return {
          success: true,
          course: response.data
        };
      } else {
        throw new Error(response.error?.message || 'Failed to create course');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing course
   */
  async updateCourse(courseId, updates) {
    try {
      const response = await apiService.updateMoodleCourse(courseId, updates);
      if (response.ok) {
        return {
          success: true,
          message: 'Course updated successfully'
        };
      } else {
        throw new Error(response.error?.message || 'Failed to update course');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for users by field
   */
  async findUsers(field, values) {
    try {
      const response = await apiService.getMoodleUsersByField(field, values);
      if (response.ok) {
        return response.data.map(user => ({
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          fullname: `${user.firstname} ${user.lastname}`.trim(),
          email: user.email,
          profileimage: user.profileimageurl || user.profileimagemobile
        }));
      } else {
        throw new Error(response.error?.message || 'Failed to find users');
      }
    } catch (error) {
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  /**
   * Enrol users in courses
   */
  async enrolUsers(enrolments) {
    try {
      // Validate enrolments
      if (!Array.isArray(enrolments) || enrolments.length === 0) {
        throw new Error('Enrolments array is required');
      }

      for (const enrolment of enrolments) {
        if (!enrolment.userid || !enrolment.courseid || !enrolment.roleid) {
          throw new Error('Each enrolment must have userid, courseid, and roleid');
        }
      }

      const response = await apiService.enrolMoodleUsers(enrolments);
      if (response.ok) {
        return {
          success: true,
          message: `Successfully enrolled ${enrolments.length} users`,
          count: enrolments.length
        };
      } else {
        throw new Error(response.error?.message || 'Failed to enrol users');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userid, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;
      const response = await apiService.getMoodleNotifications(userid, limit, offset);
      
      if (response.ok) {
        return {
          notifications: response.data.notifications || [],
          unreadcount: response.data.unreadcount || 0,
          hasMore: (response.data.notifications || []).length === limit
        };
      } else {
        throw new Error(response.error?.message || 'Failed to get notifications');
      }
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userid) {
    try {
      const response = await apiService.getMoodleUnreadCount(userid);
      if (response.ok) {
        return response.data.unread_count || 0;
      } else {
        throw new Error(response.error?.message || 'Failed to get unread count');
      }
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Attach uploaded file to course
   */
  async attachFileToCourse(courseid, draftitemid, name, intro = '') {
    try {
      const response = await apiService.attachMoodleFile({
        courseid,
        draftitemid,
        name,
        intro
      });
      
      if (response.ok) {
        return {
          success: true,
          resource: response.data
        };
      } else {
        throw new Error(response.error?.message || 'Failed to attach file');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get course categories
   */
  async getCategories() {
    console.log('📚 [MOODLE SERVICE] Getting categories...');
    try {
      const response = await apiService.getMoodleCategories();
      if (response.ok) {
        console.log('✅ [MOODLE SERVICE] Categories loaded:', response.data?.length || 0);
        return response.data || [];
      } else {
        throw new Error(response.error?.message || 'Failed to get categories');
      }
    } catch (error) {
      console.log('💥 [MOODLE SERVICE] Get categories error:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    console.log('👥 [MOODLE SERVICE] Creating user:', userData.username);
    try {
      const response = await apiService.createMoodleUser(userData);
      if (response.ok) {
        console.log('✅ [MOODLE SERVICE] User created successfully');
        return { success: true, user: response.data };
      } else {
        throw new Error(response.error?.message || 'Failed to create user');
      }
    } catch (error) {
      console.log('💥 [MOODLE SERVICE] Create user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get users using core_user_get_users function
   */
  async getUsers(criteria = null) {
    console.log('👥 [MOODLE SERVICE] Getting users with criteria:', criteria);
    try {
      const response = await apiService.getMoodleUsers(criteria);
      if (response.ok) {
        const users = response.data.map(user => ({
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          fullname: `${user.firstname} ${user.lastname}`.trim(),
          email: user.email,
          profileimage: user.profileimageurl
        }));
        console.log('✅ [MOODLE SERVICE] Users loaded:', users.length);
        return { success: true, users };
      } else {
        throw new Error(response.error?.message || 'Failed to get users');
      }
    } catch (error) {
      console.log('💥 [MOODLE SERVICE] Get users error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload file using core_files_upload web service
   */
  async uploadFileCore(formData, onProgress) {
    console.log('📁 [MOODLE SERVICE] Uploading file via core_files_upload...');
    try {
      const response = await apiService.uploadMoodleFileCore(formData.get('file'), {
        contextid: formData.get('contextid'),
        component: formData.get('component'),
        filearea: formData.get('filearea'),
        itemid: formData.get('itemid'),
        filepath: formData.get('filepath')
      });
      
      if (response.ok) {
        console.log('✅ [MOODLE SERVICE] File uploaded successfully via core service');
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.log('💥 [MOODLE SERVICE] Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available role IDs with descriptions
   */
  getRoles() {
    return {
      1: 'Manager',
      3: 'Teacher (Editing)',
      4: 'Teacher (Non-editing)', 
      5: 'Student'
    };
  }

  /**
   * Validate course data
   */
  validateCourseData(courseData) {
    const errors = [];
    
    if (!courseData.fullname || courseData.fullname.trim().length === 0) {
      errors.push('Full name is required');
    }
    
    if (!courseData.shortname || courseData.shortname.trim().length === 0) {
      errors.push('Short name is required');
    }
    
    if (!courseData.categoryid || courseData.categoryid <= 0) {
      errors.push('Valid category ID is required');
    }
    
    // Check shortname format (no spaces, special chars)
    if (courseData.shortname && !/^[A-Z0-9_-]+$/i.test(courseData.shortname)) {
      errors.push('Short name can only contain letters, numbers, underscores, and hyphens');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format error messages for display
   */
  formatError(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Get available upload methods
   */
  getUploadMethods() {
    return {
      standard: 'Standard Upload (upload.php)',
      core: 'Core Web Service (core_files_upload)'
    };
  }

  /**
   * Build user search criteria for core_user_get_users
   */
  buildUserCriteria(searchType, searchValue) {
    const validTypes = ['email', 'username', 'firstname', 'lastname', 'id'];
    if (!validTypes.includes(searchType)) {
      throw new Error(`Invalid search type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    return [{ key: searchType, value: searchValue }];
  }
}

export default new MoodleService();