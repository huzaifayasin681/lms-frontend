import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import moodleService from '../services/moodleService';
import { 
  MagnifyingGlassIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentIcon,
  FolderIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const MoodleManagerEnhanced = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseContents, setCourseContents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Course form
  const [courseForm, setCourseForm] = useState({
    fullname: '',
    shortname: '',
    categoryid: 1,
    summary: '',
    visible: 1
  });
  
  // User form
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    email: ''
  });
  
  // Enrollment form
  const [enrollForm, setEnrollForm] = useState({
    username: '',
    courseid: '',
    roleid: 5
  });

  // File upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadCategories();
    loadCourses();
    loadInstructorDashboard();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      searchCourses();
    } else {
      loadCourses();
    }
  }, [searchTerm]);

  const loadCategories = async () => {
    try {
      const cats = await moodleService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const result = await moodleService.getCourses();
      if (result.success) {
        setCourses(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const searchCourses = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const result = await moodleService.searchCourses(searchTerm);
      if (result.success) {
        setCourses(result.data?.courses || []);
      }
    } catch (error) {
      console.error('Failed to search courses:', error);
      toast.error('Failed to search courses');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseContents = async (courseId) => {
    try {
      const result = await moodleService.getCourseContents(courseId);
      if (result.success) {
        setCourseContents(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load course contents:', error);
      toast.error('Failed to load course contents');
    }
  };

  const loadInstructorDashboard = async () => {
    try {
      // Use a default user ID or get from auth context
      const userId = 2; // Replace with actual user ID
      const result = await moodleService.getInstructorDashboard(userId);
      if (result.success) {
        setDashboardData(result.data);
        setNotifications(result.data?.error_notifications || []);
      }
    } catch (error) {
      console.error('Failed to load instructor dashboard:', error);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await moodleService.createCourse(courseForm);
      if (result.success) {
        toast.success('Course created successfully!');
        setCourseForm({ fullname: '', shortname: '', categoryid: 1, summary: '', visible: 1 });
        loadCourses();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }
    
    try {
      const result = await moodleService.deleteCourse(courseId);
      if (result.success) {
        toast.success('Course deleted successfully!');
        loadCourses();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleDeleteContent = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }
    
    try {
      const result = await moodleService.deleteContent(moduleId);
      if (result.success) {
        toast.success('Content deleted successfully!');
        if (selectedCourse) {
          loadCourseContents(selectedCourse.id);
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const validateFile = async (file) => {
    try {
      const result = await moodleService.validateFile(file.name, file.size);
      return result.success && result.data?.valid;
    } catch (error) {
      console.error('File validation error:', error);
      return false;
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedCourse) {
      toast.error('Please select a file and course');
      return;
    }

    const isValid = await validateFile(selectedFile);
    if (!isValid) {
      toast.error('File validation failed');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const result = await moodleService.uploadFile(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      if (result.success) {
        toast.success('File uploaded successfully!');
        setSelectedFile(null);
        setUploadProgress(0);
        loadCourseContents(selectedCourse.id);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'courses', name: 'Courses', icon: '📚' },
    { id: 'content', name: 'Content', icon: '📁' },
    { id: 'enroll', name: 'Enrollment', icon: '🎓' },
    { id: 'dashboard', name: 'Dashboard', icon: '📊' }
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
            <span className="text-white text-lg">⚙️</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Enhanced Moodle Management</h2>
            <p className="text-sm text-gray-500">Unified course management with search, content handling, and instructor dashboard</p>
          </div>
        </div>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-8">
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search courses..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-3 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>

            {/* Course List */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {searchTerm ? `Search Results (${courses.length})` : `All Courses (${courses.length})`}
                </h4>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-lg p-4 border flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{course.fullname || course.name}</h5>
                        <p className="text-sm text-gray-500">{course.shortname} • ID: {course.id}</p>
                        {course.summary && (
                          <p className="text-xs text-gray-400 mt-1">{course.summary}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.visible ? 'Visible' : 'Hidden'}
                        </span>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete course"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {searchTerm ? 'No courses found matching your search' : 'No courses available'}
                </p>
              )}
            </div>

            {/* Create Course Form */}
            <div className="max-w-2xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create New Course</h3>
                <p className="text-gray-600">Add a new course to your Moodle instance</p>
              </div>
              
              <form onSubmit={handleCreateCourse} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Full Name *</label>
                    <input
                      type="text"
                      value={courseForm.fullname}
                      onChange={(e) => setCourseForm({...courseForm, fullname: e.target.value})}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
                      placeholder="e.g., Introduction to Computer Science"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Short Name *</label>
                    <input
                      type="text"
                      value={courseForm.shortname}
                      onChange={(e) => setCourseForm({...courseForm, shortname: e.target.value})}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
                      placeholder="e.g., CS101"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={courseForm.categoryid}
                    onChange={(e) => setCourseForm({...courseForm, categoryid: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Summary</label>
                  <textarea
                    value={courseForm.summary}
                    onChange={(e) => setCourseForm({...courseForm, summary: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
                    rows="4"
                    placeholder="Describe what students will learn in this course..."
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="visible"
                    checked={courseForm.visible === 1}
                    onChange={(e) => setCourseForm({...courseForm, visible: e.target.checked ? 1 : 0})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="visible" className="ml-3 text-sm font-medium text-gray-700">
                    Make course visible to students
                  </label>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Course...' : '🎓 Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Course Content Management</h3>
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const course = courses.find(c => c.id === parseInt(e.target.value));
                  setSelectedCourse(course);
                  if (course) loadCourseContents(course.id);
                }}
                className="block w-64 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.fullname || course.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedCourse && (
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">Upload Content (≤100 MB)</h4>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.html,.css,.js,.json,.xml,.py,.java,.c,.cpp,.cs,.php,.zip,.rar,.7z,.mp3,.wav,.mp4,.avi,.mov,.webm,.ogg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported: Documents, Images, Text/Code files, Audio/Video, Archives (max 100MB)
                      </p>
                    </div>
                    
                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleFileUpload}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    )}
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Content Display */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">
                    Content for: {selectedCourse.fullname || selectedCourse.name}
                  </h4>
                  
                  {courseContents.length > 0 ? (
                    <div className="space-y-3">
                      {courseContents.map((section) => (
                        <div key={section.id} className="bg-white rounded-lg p-4 border">
                          <h5 className="font-medium text-gray-900 mb-2">
                            {section.name || `Section ${section.section}`}
                          </h5>
                          {section.modules && section.modules.length > 0 ? (
                            <div className="space-y-2">
                              {section.modules.map((module) => (
                                <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                  <div className="flex items-center space-x-3">
                                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{module.name}</p>
                                      <p className="text-xs text-gray-500">{module.modname}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteContent(module.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete content"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No content in this section</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No content found for this course</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Instructor Dashboard</h3>
            
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <FolderIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Courses</p>
                      <p className="text-2xl font-bold text-blue-900">{dashboardData.total_courses}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600">Error Notifications</p>
                      <p className="text-2xl font-bold text-yellow-900">{notifications.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Unread Notifications</p>
                      <p className="text-2xl font-bold text-green-900">{dashboardData.unread_notifications_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {notifications.length > 0 && (
              <div className="bg-white rounded-lg border border-red-200">
                <div className="px-6 py-4 border-b border-red-200">
                  <h4 className="text-lg font-medium text-red-900">Error Notifications & Alerts</h4>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                        <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">{notification.subject}</p>
                          <p className="text-sm text-red-700 mt-1">{notification.text}</p>
                          <p className="text-xs text-red-500 mt-2">
                            {new Date(notification.timecreated * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'enroll' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Enroll User</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={enrollForm.username}
                  onChange={(e) => setEnrollForm({...enrollForm, username: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter username to enroll"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Course ID</label>
                <input
                  type="number"
                  value={enrollForm.courseid}
                  onChange={(e) => setEnrollForm({...enrollForm, courseid: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter course ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={enrollForm.roleid}
                  onChange={(e) => setEnrollForm({...enrollForm, roleid: parseInt(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={5}>Student</option>
                  <option value={4}>Teacher (Non-editing)</option>
                  <option value={3}>Teacher (Editing)</option>
                  <option value={1}>Manager</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Enrolling...' : 'Enroll User'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodleManagerEnhanced;