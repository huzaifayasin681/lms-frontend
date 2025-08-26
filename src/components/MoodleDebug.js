import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import moodleService from '../services/moodleService';

const MoodleDebug = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing Moodle connection...');
      const result = await moodleService.testConnection();
      console.log('📥 Connection result:', result);
      
      if (result.success) {
        toast.success('Moodle connection successful!');
        setResults(prev => ({ ...prev, connection: result }));
      } else {
        toast.error(`Connection failed: ${result.error}`);
        setResults(prev => ({ ...prev, connection: result }));
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error(`Connection error: ${error.message}`);
      setResults(prev => ({ ...prev, connection: { success: false, error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const testCourses = async () => {
    setLoading(true);
    try {
      console.log('📚 Testing courses fetch...');
      const result = await moodleService.getCourses();
      console.log('📥 Courses result:', result);
      
      if (result.success) {
        toast.success(`Found ${result.data?.length || 0} courses`);
        setResults(prev => ({ ...prev, courses: result }));
      } else {
        toast.error(`Courses fetch failed: ${result.error}`);
        setResults(prev => ({ ...prev, courses: result }));
      }
    } catch (error) {
      console.error('Courses test error:', error);
      toast.error(`Courses error: ${error.message}`);
      setResults(prev => ({ ...prev, courses: { success: false, error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const testCategories = async () => {
    setLoading(true);
    try {
      console.log('📂 Testing categories fetch...');
      const categories = await moodleService.getCategories();
      console.log('📥 Categories result:', categories);
      
      toast.success(`Found ${categories?.length || 0} categories`);
      setResults(prev => ({ ...prev, categories: { success: true, data: categories } }));
    } catch (error) {
      console.error('Categories test error:', error);
      toast.error(`Categories error: ${error.message}`);
      setResults(prev => ({ ...prev, categories: { success: false, error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Moodle Debug Panel</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={testCourses}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Courses'}
          </button>
          
          <button
            onClick={testCategories}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Categories'}
          </button>
        </div>

        {results && (
          <div className="mt-6 space-y-4">
            {results.connection && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium text-gray-900">Connection Test</h3>
                <pre className="mt-2 text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(results.connection, null, 2)}
                </pre>
              </div>
            )}
            
            {results.courses && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium text-gray-900">Courses Test</h3>
                <pre className="mt-2 text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(results.courses, null, 2)}
                </pre>
              </div>
            )}
            
            {results.categories && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium text-gray-900">Categories Test</h3>
                <pre className="mt-2 text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(results.categories, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodleDebug;