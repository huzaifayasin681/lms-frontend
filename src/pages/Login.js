import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import apiService from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [moodleFormData, setMoodleFormData] = useState({
    moodleUsername: '',
    moodlePassword: '',
  });
  const [showMoodleLogin, setShowMoodleLogin] = useState(false);
  const { login, loginWithToken, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMoodleChange = (e) => {
    const { name, value } = e.target;
    setMoodleFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.username, formData.password);
    if (result.success) {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    }
  };

  const handleMoodleLogin = async (e) => {
    e.preventDefault();
    try {
      // Call the Moodle login API
      const response = await apiService.moodleLogin(
        moodleFormData.moodleUsername,
        moodleFormData.moodlePassword
      );

      if (response.ok && response.data && response.data.token) {
        toast.success('Moodle login successful!');
        // Store the Moodle token
        localStorage.setItem('token', response.data.token);
        // Update the auth context
        loginWithToken(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        toast.error(response.error?.message || 'Moodle login failed');
      }
    } catch (error) {
      console.error('Moodle login error:', error);
      toast.error('Moodle login failed: ' + (error.message || 'Please try again.'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showMoodleLogin ? 'Moodle Login' : 'Sign in to your account'}
          </h2>
          <div className="mt-2 text-center">
            <button
              onClick={() => setShowMoodleLogin(!showMoodleLogin)}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              {showMoodleLogin ? 'Use regular login' : 'Login with Moodle credentials'}
            </button>
          </div>
        </div>
        
        {!showMoodleLogin ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleMoodleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="moodleUsername" className="sr-only">
                  Moodle Username
                </label>
                <input
                  id="moodleUsername"
                  name="moodleUsername"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Moodle Username"
                  value={moodleFormData.moodleUsername}
                  onChange={handleMoodleChange}
                />
              </div>
              <div>
                <label htmlFor="moodlePassword" className="sr-only">
                  Moodle Password
                </label>
                <input
                  id="moodlePassword"
                  name="moodlePassword"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Moodle Password"
                  value={moodleFormData.moodlePassword}
                  onChange={handleMoodleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login with Moodle'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;