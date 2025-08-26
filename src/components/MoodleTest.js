import React, { useState, useEffect } from 'react';
import moodleService from '../services/moodleService';

const MoodleTest = () => {
  const [siteInfo, setSiteInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Test failed';
      setError(errorMsg);
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: errorMsg }
      }));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testSiteInfo = async () => {
    const result = await runTest('siteInfo', async () => {
      const connectionResult = await moodleService.testConnection();
      if (connectionResult.success) {
        setSiteInfo(connectionResult.siteInfo);
        return connectionResult.siteInfo;
      } else {
        throw new Error(connectionResult.error);
      }
    });
    return result;
  };

  const testCourses = async () => {
    const result = await runTest('courses', async () => {
      const coursesData = await moodleService.getCourses();
      setCourses(coursesData);
      return coursesData;
    });
    return result;
  };

  const testCreateCourse = async () => {
    const courseData = {
      fullname: `Test Course ${Date.now()}`,
      shortname: `TEST${Date.now()}`,
      categoryid: 1,
      summary: 'Test course created from LMS frontend'
    };

    return await runTest('createCourse', async () => {
      const result = await moodleService.createCourse(courseData);
      if (result.success) {
        // Refresh courses list
        await testCourses();
        return result.course;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const testUserLookup = async () => {
    return await runTest('userLookup', async () => {
      const users = await moodleService.findUsers('username', ['moodadmin']);
      return users;
    });
  };

  const runAllTests = async () => {
    try {
      await testSiteInfo();
      await testCourses();
      await testUserLookup();
    } catch (err) {
      console.error('Test suite failed:', err);
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const TestResult = ({ testName, result }) => {
    if (!result) return null;

    return (
      <div className={`p-3 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅' : '❌'} {testName}
          </span>
        </div>
        {result.success ? (
          <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-red-700">{result.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Moodle API Integration Test</h1>
        
        {loading && (
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Running tests...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Run All Tests
          </button>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={testSiteInfo}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Test Site Info
            </button>
            <button
              onClick={testCourses}
              disabled={loading}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              Test Courses
            </button>
            <button
              onClick={testCreateCourse}
              disabled={loading}
              className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              Create Test Course
            </button>
            <button
              onClick={testUserLookup}
              disabled={loading}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Test User Lookup
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Test Results</h2>
          
          <TestResult testName="Site Info" result={testResults.siteInfo} />
          <TestResult testName="Courses List" result={testResults.courses} />
          <TestResult testName="User Lookup" result={testResults.userLookup} />
          <TestResult testName="Create Course" result={testResults.createCourse} />
        </div>

        {siteInfo && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Moodle Site Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Site Name:</span>
                <p className="text-gray-800">{siteInfo.sitename}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Version:</span>
                <p className="text-gray-800">{siteInfo.version}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Release:</span>
                <p className="text-gray-800">{siteInfo.release}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Functions:</span>
                <p className="text-gray-800">{siteInfo.functions?.length || 0} available</p>
              </div>
            </div>
          </div>
        )}

        {courses.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Available Courses ({courses.length})</h3>
            <div className="space-y-2">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">{course.fullname}</h4>
                      <p className="text-sm text-gray-600">Short name: {course.shortname}</p>
                      <p className="text-sm text-gray-600">ID: {course.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      course.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {course.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              ))}
              {courses.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  ... and {courses.length - 5} more courses
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodleTest;