import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CourseForm = ({ course, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    course_id: '',
    name: '',
    short_name: '',
    description: '',
    category: '',
    lms: 'local',
    visibility: 'private',
    access_level: 'enrolled',
    active: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        course_id: course.course_id || '',
        name: course.name || '',
        short_name: course.short_name || '',
        description: course.description || '',
        category: course.category || '',
        lms: course.lms || 'local',
        visibility: course.visibility || 'private',
        access_level: course.access_level || 'enrolled',
        active: course.active !== undefined ? course.active : true,
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.course_id.trim()) {
      newErrors.course_id = 'Course ID is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.course_id)) {
      newErrors.course_id = 'Course ID can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Course name must be at least 3 characters';
    }

    if (!formData.short_name.trim()) {
      newErrors.short_name = 'Short name is required';
    } else if (formData.short_name.length < 2) {
      newErrors.short_name = 'Short name must be at least 2 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.category && formData.category.length > 100) {
      newErrors.category = 'Category must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      // Form will be closed by parent component on success
    } catch (error) {
      // Handle any specific form errors from the API
      if (error.message.includes('already exists')) {
        setErrors({ course_id: 'This Course ID already exists' });
      }
    } finally {
      setLoading(false);
    }
  };

  const lmsOptions = [
    { value: 'local', label: 'Local Only' },
    { value: 'moodle', label: 'Moodle' },
    { value: 'canvas', label: 'Canvas' },
    { value: 'sakai', label: 'Sakai' },
    { value: 'chamilo', label: 'Chamilo' },
  ];

  const commonCategories = [
    'General',
    'Computer Science',
    'Mathematics',
    'Science',
    'Languages',
    'Business',
    'Arts',
    'History',
    'Psychology',
    'Engineering',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {course ? 'Edit Course' : 'Create New Course'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Course ID */}
                <div>
                  <label htmlFor="course_id" className="block text-sm font-medium text-gray-700">
                    Course ID *
                  </label>
                  <input
                    type="text"
                    id="course_id"
                    name="course_id"
                    required
                    disabled={!!course} // Disable editing course_id for existing courses
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.course_id ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      course ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="e.g., CS101, MATH201"
                    value={formData.course_id}
                    onChange={handleChange}
                  />
                  {errors.course_id && <p className="mt-1 text-sm text-red-600">{errors.course_id}</p>}
                  {course && (
                    <p className="mt-1 text-xs text-gray-500">Course ID cannot be changed after creation</p>
                  )}
                </div>

                {/* Course Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="e.g., Introduction to Computer Science"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Short Name */}
                <div>
                  <label htmlFor="short_name" className="block text-sm font-medium text-gray-700">
                    Short Name *
                  </label>
                  <input
                    type="text"
                    id="short_name"
                    name="short_name"
                    required
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.short_name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="e.g., Intro CS"
                    value={formData.short_name}
                    onChange={handleChange}
                  />
                  {errors.short_name && <p className="mt-1 text-sm text-red-600">{errors.short_name}</p>}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="Brief description of the course..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    list="categories"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="e.g., Computer Science"
                    value={formData.category}
                    onChange={handleChange}
                  />
                  <datalist id="categories">
                    {commonCategories.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                {/* LMS Platform */}
                <div>
                  <label htmlFor="lms" className="block text-sm font-medium text-gray-700">
                    LMS Platform
                  </label>
                  <select
                    id="lms"
                    name="lms"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.lms}
                    onChange={handleChange}
                  >
                    {lmsOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} {option.value === 'moodle' ? '(Integrated)' : ''}
                      </option>
                    ))}
                  </select>
                  {formData.lms === 'moodle' && (
                    <p className="mt-1 text-xs text-blue-600">
                      🔗 This course will be created in Moodle and synced locally
                    </p>
                  )}
                </div>

                {/* Visibility Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                      Visibility
                    </label>
                    <select
                      id="visibility"
                      name="visibility"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.visibility}
                      onChange={handleChange}
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="access_level" className="block text-sm font-medium text-gray-700">
                      Access Level
                    </label>
                    <select
                      id="access_level"
                      name="access_level"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.access_level}
                      onChange={handleChange}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="enrolled">Enrolled Students</option>
                      <option value="instructors">Instructors Only</option>
                    </select>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    id="active"
                    name="active"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.active}
                    onChange={handleChange}
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                    Active course
                  </label>
                </div>

                {/* Form Actions */}
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : (course ? 'Update Course' : 'Create Course')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseForm;