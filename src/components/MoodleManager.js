import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import moodleService from '../services/moodleService';

const MoodleManager = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  
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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await moodleService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
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
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await moodleService.createUser(userForm);
      if (result.success) {
        toast.success('User created successfully!');
        setUserForm({ username: '', password: '', firstname: '', lastname: '', email: '' });
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      if (error.status === 403) {
        toast.error('Admin token does not have permission to create users');
      } else {
        toast.error('Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Find user first
      const foundUsers = await moodleService.findUsers('username', [enrollForm.username]);
      if (foundUsers.length === 0) {
        toast.error('User not found');
        return;
      }
      
      const user = foundUsers[0];
      const enrolments = [{
        userid: user.id,
        courseid: parseInt(enrollForm.courseid),
        roleid: parseInt(enrollForm.roleid)
      }];
      
      const result = await moodleService.enrolUsers(enrolments);
      if (result.success) {
        toast.success('User enrolled successfully!');
        setEnrollForm({ username: '', courseid: '', roleid: 5 });
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to enroll user');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'courses', name: 'Courses', icon: '📚' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'enroll', name: 'Enrollment', icon: '🎓' },
    { id: 'files', name: 'Files', icon: '📁' }
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
            <span className="text-white text-lg">⚙️</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Management Tools</h2>
            <p className="text-sm text-gray-500">Create and manage Moodle resources</p>
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
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Course...
                    </>
                  ) : (
                    <>🎓 Create Course</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Create User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={userForm.firstname}
                    onChange={(e) => setUserForm({...userForm, firstname: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={userForm.lastname}
                    onChange={(e) => setUserForm({...userForm, lastname: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'enroll' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Enroll User</h3>
            <form onSubmit={handleEnrollUser} className="space-y-4">
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

        {activeTab === 'files' && (
          <div>
            <h3 className="text-lg font-medium mb-4">File Management</h3>
            <div className="text-center py-8 text-gray-500">
              <p>📁 File upload and management</p>
              <p className="text-sm">Feature coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodleManager;