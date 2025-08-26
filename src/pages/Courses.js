import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import moodleService from '../services/moodleService';
import toast from 'react-hot-toast';
import CourseList from '../components/CourseList';
import CourseForm from '../components/CourseForm';
import ConfirmModal from '../components/ConfirmModal';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    lms: '',
    active: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [moodleConnected, setMoodleConnected] = useState(false);

  useEffect(() => {
    fetchCourses();
    checkMoodleConnection();
  }, [pagination.page, searchTerm, filters]);

  const checkMoodleConnection = async () => {
    try {
      const result = await moodleService.testConnection();
      setMoodleConnected(result.success);
    } catch (error) {
      setMoodleConnected(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (filters.category) {
        params.category = filters.category;
      }

      if (filters.lms) {
        params.lms = filters.lms;
      }

      if (filters.active !== '') {
        params.active = filters.active;
      }

      const response = await ApiService.getCourses(params);
      setCourses(response.courses);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Fetch courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCourses();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ category: '', lms: '', active: '' });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowForm(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleDeleteCourse = (course) => {
    setDeleteConfirm(course);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await ApiService.deleteCourse(deleteConfirm.course_id);
      toast.success('Course deleted successfully');
      setDeleteConfirm(null);
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingCourse) {
        await ApiService.updateCourse(editingCourse.course_id, formData);
        toast.success('Course updated successfully');
      } else {
        await ApiService.createCourse(formData);
        toast.success('Course created successfully');
      }
      setShowForm(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      toast.error(editingCourse ? 'Failed to update course' : 'Failed to create course');
      throw error; // Re-throw to let form handle it
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleMoodleSync = async () => {
    if (!moodleConnected) {
      toast.error('Moodle is not connected');
      return;
    }

    setSyncing(true);
    try {
      // Sync courses from Moodle to local database
      await ApiService.syncCourses('moodle');
      toast.success('Moodle courses synced successfully');
      fetchCourses(); // Refresh the course list
    } catch (error) {
      toast.error('Failed to sync Moodle courses');
      console.error('Moodle sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateMoodleCourse = async (courseData) => {
    if (!moodleConnected) {
      toast.error('Moodle is not connected');
      return;
    }

    try {
      // Create course in Moodle first
      const moodleCourse = {
        fullname: courseData.name,
        shortname: courseData.short_name,
        categoryid: 1, // Default category
        summary: courseData.description || '',
        visible: courseData.visibility === 'public' ? 1 : 0
      };
      
      const result = await moodleService.createCourse(moodleCourse);
      if (result.success) {
        // Then create in local database with Moodle reference
        const localCourseData = {
          ...courseData,
          lms: 'moodle',
          external_id: result.course.id
        };
        
        await ApiService.createCourse(localCourseData);
        toast.success('Course created in Moodle and local database');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Failed to create Moodle course');
      throw error;
    }
  };

  // Get unique categories and LMS types for filters
  const categories = [...new Set(courses.map(course => course.category).filter(Boolean))];
  const lmsTypes = [...new Set(courses.map(course => course.lms).filter(Boolean))];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-gray-600">
                Manage your LMS courses across different platforms
              </p>
              {moodleConnected && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                  Moodle Connected
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {moodleConnected && (
              <button
                onClick={handleMoodleSync}
                disabled={syncing}
                className="btn-secondary inline-flex items-center"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Moodle'}
              </button>
            )}
            <button
              onClick={handleCreateCourse}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Course
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary inline-flex items-center"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {(filters.category || filters.lms || filters.active !== '') && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LMS Platform
                  </label>
                  <select
                    className="input-field"
                    value={filters.lms}
                    onChange={(e) => handleFilterChange('lms', e.target.value)}
                  >
                    <option value="">All Platforms</option>
                    {lmsTypes.map(lms => (
                      <option key={lms} value={lms}>
                        {lms.charAt(0).toUpperCase() + lms.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="input-field"
                    value={filters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course List */}
      <CourseList
        courses={courses}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
      />

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          course={editingCourse}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingCourse(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Course"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          danger
        />
      )}
    </div>
  );
};

export default Courses;