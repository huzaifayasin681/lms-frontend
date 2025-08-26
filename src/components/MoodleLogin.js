import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

const MoodleLogin = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔐 [MOODLE LOGIN] Login attempt started');
    console.log('📝 [MOODLE LOGIN] Credentials provided:', {
      username: credentials.username,
      hasPassword: !!credentials.password,
      passwordLength: credentials.password?.length || 0
    });
    
    if (!credentials.username || !credentials.password) {
      console.log('❌ [MOODLE LOGIN] Missing credentials');
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🌐 [MOODLE LOGIN] Calling apiService.moodleLogin()');
      const response = await apiService.moodleLogin(credentials.username, credentials.password);
      
      console.log('📥 [MOODLE LOGIN] Login response received:', {
        ok: response.ok,
        hasData: !!response.data,
        hasError: !!response.error,
        userInfo: response.data?.user ? {
          id: response.data.user.id,
          username: response.data.user.username,
          fullname: response.data.user.fullname
        } : null,
        hasToken: !!response.data?.token
      });
      
      if (response.ok) {
        console.log('✅ [MOODLE LOGIN] Login successful for user:', response.data.user.fullname);
        console.log('🔑 [MOODLE LOGIN] Using configured token for operations');
        toast.success(`Welcome ${response.data.user.fullname}! (Using configured token)`);
        onLoginSuccess(response.data);
        
        // Clear credentials after successful login
        setCredentials({ username: '', password: '' });
      } else {
        console.log('❌ [MOODLE LOGIN] Login failed:', response.error);
        toast.error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.log('💥 [MOODLE LOGIN] Login error caught:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
      console.log('🏁 [MOODLE LOGIN] Login attempt completed');
    }
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
            placeholder="Enter your Moodle username"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
            placeholder="Enter your Moodle password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </>
          ) : (
            <>🔐 Login to Moodle</>
          )}
        </button>
      </form>
    </div>
  );
};

export default MoodleLogin;