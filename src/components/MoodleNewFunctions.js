import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import moodleService from '../services/moodleService';

const MoodleNewFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Test core_user_get_users
  const testGetUsers = async () => {
    setLoading(true);
    try {
      const criteria = moodleService.buildUserCriteria('email', 'admin@example.com');
      const result = await moodleService.getUsers(criteria);
      
      if (result.success) {
        setSearchResults(result.users);
        toast.success(`Found ${result.users.length} users`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to get users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test core_files_upload
  const testCoreUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contextid', '1');
      formData.append('component', 'user');
      formData.append('filearea', 'draft');

      const result = await moodleService.uploadFileCore(formData, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        toast.success('File uploaded successfully via core service!');
        console.log('Upload result:', result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">New Moodle Functions Test</h2>
        <p className="text-gray-600">Test the newly implemented core_user_get_users and core_files_upload functions</p>
      </div>

      <div className="space-y-8">
        {/* Test core_user_get_users */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">🔍 Test core_user_get_users</h3>
          <div className="space-y-4">
            <button
              onClick={testGetUsers}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Users by Email'}
            </button>
            
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Search Results:</h4>
                <div className="bg-gray-50 rounded p-4">
                  {searchResults.map((user, index) => (
                    <div key={index} className="border-b border-gray-200 py-2 last:border-b-0">
                      <p><strong>ID:</strong> {user.id}</p>
                      <p><strong>Username:</strong> {user.username}</p>
                      <p><strong>Name:</strong> {user.fullname}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test core_files_upload */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">📁 Test core_files_upload</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select file to upload via core web service:
              </label>
              <input
                type="file"
                onChange={testCoreUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <p><strong>Parameters:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Context ID: 1 (system context)</li>
                <li>Component: user</li>
                <li>File Area: draft</li>
                <li>Item ID: 0 (new draft)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="border border-green-200 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-800 mb-2">✅ Implementation Status</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p>• <strong>core_user_get_users:</strong> Implemented with criteria support</p>
            <p>• <strong>core_files_upload:</strong> Implemented with base64 encoding</p>
            <p>• <strong>API Endpoints:</strong> GET /api/moodle/users, POST /api/moodle/files/upload-core</p>
            <p>• <strong>Frontend Services:</strong> moodleService.getUsers(), moodleService.uploadFileCore()</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodleNewFunctions;