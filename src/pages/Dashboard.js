import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ServerIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    moodleCourses: 0,
    canvasCourses: 0,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent courses
      const coursesResponse = await ApiService.getCourses({ limit: 5 });
      setRecentCourses(coursesResponse.courses);
      
      // Calculate stats
      const allCoursesResponse = await ApiService.getCourses({ limit: 1000 });
      const allCourses = allCoursesResponse.courses;
      
      setStats({
        totalCourses: allCourses.length,
        activeCourses: allCourses.filter(course => course.active).length,
        moodleCourses: allCourses.filter(course => course.lms === 'moodle').length,
        canvasCourses: allCourses.filter(course => course.lms === 'canvas').length,
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (lmsType) => {
    try {
      const result = await ApiService.syncCourses(lmsType);
      toast.success(`Synced ${result.synced} new courses from ${lmsType.charAt(0).toUpperCase() + lmsType.slice(1)}`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error(`Failed to sync courses from ${lmsType}`);
    }
  };

  const statCards = [
    {
      name: 'Total Courses',
      value: stats.totalCourses,
      icon: AcademicCapIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Active Courses',
      value: stats.activeCourses,
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      name: 'Moodle Courses',
      value: stats.moodleCourses,
      icon: ServerIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      name: 'Canvas Courses',
      value: stats.canvasCourses,
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your LMS course management system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.bg} p-3 rounded-md`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Courses */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Courses</h2>
              <Link
                to="/courses"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentCourses.length > 0 ? (
              <ul className="space-y-3">
                {recentCourses.map((course) => (
                  <li key={course.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {course.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {course.short_name} • {course.lms.charAt(0).toUpperCase() + course.lms.slice(1)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        course.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No courses found</p>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        {user?.is_admin && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Admin Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Sync Courses from External LMS
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSync('moodle')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Sync Moodle
                  </button>
                  <button
                    onClick={() => handleSync('canvas')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Sync Canvas
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sync courses from your configured LMS instances
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/courses"
                  className="btn-primary w-full justify-center inline-flex items-center"
                >
                  Manage All Courses
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;