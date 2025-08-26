import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import moodleService from '../services/moodleService';
import MoodleLogin from '../components/MoodleLogin';
import MoodleManager from '../components/MoodleManager';
import MoodleNotifications from '../components/MoodleNotifications';

const MoodleIntegration = () => {
  const [siteInfo, setSiteInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [moodleUser, setMoodleUser] = useState(null);

  useEffect(() => {
    console.log('🔄 [MOODLE INIT] Component mounted, testing connection...');
    checkConnection();
  }, []);

  const checkConnection = async () => {
    console.log('🔄 [MOODLE] Starting connection test...');
    console.log('📊 [MOODLE] Current state:', { connected, siteInfo: !!siteInfo });
    
    setLoading(true);
    try {
      console.log('🌐 [MOODLE] Calling moodleService.testConnection()');
      const result = await moodleService.testConnection();
      
      console.log('📥 [MOODLE] Connection test result:', {
        success: result.success,
        hasError: !!result.error,
        hasSiteInfo: !!result.siteInfo,
        siteInfoKeys: result.siteInfo ? Object.keys(result.siteInfo) : []
      });
      
      if (result.success) {
        console.log('✅ [MOODLE] Connection successful with configured token!');
        console.log('📋 [MOODLE] Site info received:', {
          sitename: result.siteInfo?.sitename,
          version: result.siteInfo?.version,
          release: result.siteInfo?.release,
          functionsCount: result.siteInfo?.functions?.length || 0,
          tokenType: 'configured'
        });
        
        setConnected(true);
        setSiteInfo(result.siteInfo);
        toast.success('Connected to Moodle successfully');
        
        console.log('🔄 [MOODLE] Loading courses after successful connection...');
        loadCourses();
      } else {
        console.log('❌ [MOODLE] Connection failed:', result.error);
        setConnected(false);
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      console.log('💥 [MOODLE] Connection error caught:', {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack
      });
      setConnected(false);
      toast.error(`Connection error: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('🏁 [MOODLE] Connection test completed');
    }
  };

  const loadCourses = async () => {
    console.log('📚 [MOODLE] Starting to load courses...');
    try {
      console.log('🌐 [MOODLE] Calling moodleService.getCourses()');
      const coursesData = await moodleService.getCourses();
      
      console.log('📥 [MOODLE] Courses data received:', {
        count: coursesData?.length || 0,
        isArray: Array.isArray(coursesData),
        firstCourse: coursesData?.[0] ? {
          id: coursesData[0].id,
          fullname: coursesData[0].fullname,
          shortname: coursesData[0].shortname,
          visible: coursesData[0].visible
        } : null
      });
      
      setCourses(coursesData);
      console.log('✅ [MOODLE] Courses loaded successfully:', coursesData?.length || 0, 'courses');
    } catch (error) {
      console.log('💥 [MOODLE] Failed to load courses:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      toast.error(`Failed to load courses: ${error.message}`);
    }
  };

  const syncCourses = async () => {
    console.log('🔄 [MOODLE SYNC] Starting course synchronization...');
    console.log('📊 [MOODLE SYNC] Current courses count:', courses.length);
    
    setLoading(true);
    try {
      console.log('🌐 [MOODLE SYNC] Fetching latest courses from Moodle...');
      const oldCount = courses.length;
      
      await loadCourses();
      
      // Note: This is a simple sync that just refreshes the course list
      // In a full implementation, this would:
      // 1. Compare local DB courses with Moodle courses
      // 2. Create/update/delete courses in local DB
      // 3. Handle enrollment synchronization
      // 4. Sync course content and metadata
      
      console.log('✅ [MOODLE SYNC] Course sync completed:', {
        previousCount: oldCount,
        newCount: courses.length,
        action: 'Refreshed course list from Moodle'
      });
      
      toast.success('Courses synced successfully');
    } catch (error) {
      console.log('💥 [MOODLE SYNC] Sync failed:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('🏁 [MOODLE SYNC] Sync process completed');
    }
  };

  const handleMoodleLogin = (loginData) => {
    console.log('🔐 [MOODLE LOGIN] User login successful:', {
      hasUser: !!loginData.user,
      hasToken: !!loginData.token,
      userInfo: loginData.user ? {
        id: loginData.user.id,
        username: loginData.user.username,
        fullname: loginData.user.fullname
      } : null
    });
    
    setMoodleUser(loginData.user);
    localStorage.setItem('moodleToken', loginData.token);
    
    console.log('💾 [MOODLE LOGIN] Token stored in localStorage');
    
    // Auto-test connection after successful login
    console.log('🔄 [MOODLE LOGIN] Auto-testing connection after login...');
    setTimeout(() => {
      checkConnection();
    }, 500);
  };

  const handleMoodleLogout = () => {
    console.log('🚪 [MOODLE LOGOUT] Logging out user:', moodleUser?.username);
    
    setMoodleUser(null);
    setConnected(false);
    setSiteInfo(null);
    setCourses([]);
    localStorage.removeItem('moodleToken');
    
    console.log('🗑️ [MOODLE LOGOUT] Token removed and state cleared');
    toast.success('Logged out from Moodle');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Moodle Integration</h1>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🔑 Admin Token
                </span>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${
                    connected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {connected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {moodleUser && connected && (
                <MoodleNotifications userId={moodleUser.id} />
              )}
              <button
                onClick={checkConnection}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </>
                ) : (
                  <>🔄 Test Connection</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

        {/* Site Info Cards */}
        {siteInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🏫</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Site Name</dt>
                      <dd className="text-lg font-medium text-gray-900">{siteInfo.sitename}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-green-600 text-lg">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Version</dt>
                      <dd className="text-lg font-medium text-gray-900">{siteInfo.release}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <span className="text-purple-600 text-lg">⚡</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Functions</dt>
                      <dd className="text-lg font-medium text-gray-900">{siteInfo.functions?.length || 0} available</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Authentication Section */}
        {moodleUser ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{moodleUser.firstname?.[0]}{moodleUser.lastname?.[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{moodleUser.fullname}</h3>
                    <p className="text-sm text-gray-500">@{moodleUser.username} • Authenticated</p>
                  </div>
                </div>
                <button
                  onClick={handleMoodleLogout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🔑</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">User Authentication</h3>
                  <p className="text-sm text-gray-500">Login with your Moodle credentials to access user-specific features</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <MoodleLogin onLoginSuccess={handleMoodleLogin} />
            </div>
          </div>
        )}

        {/* Courses Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                  <span className="text-orange-600 text-lg">📚</span>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Courses</h2>
                  <p className="text-sm text-gray-500">{courses.length} courses available</p>
                </div>
              </div>
              <button
                onClick={syncCourses}
                disabled={loading || !connected}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>🔄 Sync Courses</>
                )}
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {courses.length > 0 ? (
              <div className="grid gap-4">
                {courses.map((course) => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">{course.shortname?.substring(0, 2) || 'CO'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 truncate">{course.fullname}</h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-500">{course.shortname}</p>
                              <p className="text-sm text-gray-500">ID: {course.id}</p>
                            </div>
                            {course.summary && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{course.summary}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.visible ? '✓ Visible' : '🚫 Hidden'}
                        </span>
                        {course.enrolledusers > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            👥 {course.enrolledusers}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">📚</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-500">
                  {connected ? 'No courses are available in your Moodle instance.' : 'Connect to Moodle to view courses.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Management Tools */}
        {connected && (
          <MoodleManager />
        )}
        </div>
      </div>
    </div>
  );
};

export default MoodleIntegration;