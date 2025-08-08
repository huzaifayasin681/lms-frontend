import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import toast from 'react-hot-toast';
import ContentList from '../components/ContentList';
import ContentUpload from '../components/ContentUpload';
import {
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const CourseContent = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    sort: 'upload_date'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchContent();
  }, [courseId, filters]);

  const fetchCourse = async () => {
    try {
      const courseData = await ApiService.getCourse(courseId);
      setCourse(courseData);
    } catch (error) {
      toast.error('Failed to load course details');
      console.error('Fetch course error:', error);
    }
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.type) {
        params.type = filters.type;
      }
      
      if (filters.sort) {
        params.sort = filters.sort;
      }

      const response = await ApiService.getCourseContent(courseId, params);
      setContent(response.content);
    } catch (error) {
      toast.error('Failed to load course content');
      console.error('Fetch content error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchContent(); // Refresh content list
  };

  const handleEdit = (contentItem) => {
    // For now, just show a toast. In a full implementation, you'd open an edit modal
    toast.success('Edit functionality would be implemented here');
    console.log('Edit content:', contentItem);
  };

  const handleDelete = async (contentId) => {
    try {
      await ApiService.deleteContentItem(contentId);
      toast.success('Content deleted successfully');
      fetchContent(); // Refresh content list
    } catch (error) {
      toast.error('Failed to delete content');
      throw error; // Re-throw to let the component handle it
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: '', sort: 'upload_date' });
  };

  const contentStats = {
    total: content.length,
    files: content.filter(item => item.content_type === 'file').length,
    urls: content.filter(item => item.content_type === 'url').length,
    texts: content.filter(item => item.content_type === 'text').length
  };

  if (loading && !content.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {course ? course.name : 'Course Content'}
            </h1>
            <p className="text-gray-600 mt-2">
              {course ? `${course.short_name} • Manage course materials and resources` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload Content
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { name: 'Total Items', value: contentStats.total, color: 'text-blue-600' },
            { name: 'Files', value: contentStats.files, color: 'text-green-600' },
            { name: 'URLs', value: contentStats.urls, color: 'text-yellow-600' },
            { name: 'Text Content', value: contentStats.texts, color: 'text-purple-600' }
          ].map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary inline-flex items-center"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {(filters.type || filters.sort !== 'upload_date') && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    !
                  </span>
                )}
              </button>
              
              <button
                onClick={fetchContent}
                className="btn-secondary inline-flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    className="input-field"
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="file">Files</option>
                    <option value="url">URLs</option>
                    <option value="text">Text Content</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    className="input-field"
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                  >
                    <option value="upload_date">Upload Date</option>
                    <option value="title">Title</option>
                    <option value="size">File Size</option>
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

      {/* Content List */}
      <ContentList
        content={content}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchContent}
      />

      {/* Upload Modal */}
      {showUpload && (
        <ContentUpload
          courseId={courseId}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};

export default CourseContent;