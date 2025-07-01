import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, updateUserSettings } = useAuth();
  const [stats, setStats] = useState(null);
  const [profilePublic, setProfilePublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    setProfilePublic(user?.profile_public || false);
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/coins/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileVisibilityChange = async (isPublic) => {
    const success = await updateUserSettings({ isPublic });
    if (success) {
      setProfilePublic(isPublic);
    }
  };

  const getCompletionPercentage = () => {
    if (!stats) return 0;
    return stats.overall_completion_percentage || 0;
  };

  const getShareUrl = () => {
    return `${window.location.origin}/profile/${user.id}`;
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(getShareUrl());
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name}!
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow dark:shadow-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">%</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Collection Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {getCompletionPercentage()}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow dark:shadow-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">Q</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Quarters Owned
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats?.owned_quarters || 0} / {stats?.total_quarters_available || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow dark:shadow-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Series Collected
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats?.series_with_coins || 0} / {stats?.total_series_available || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow dark:shadow-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">R</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Recent Additions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats?.recent_acquisitions?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Series Breakdown */}
        {stats?.series_breakdown && stats.series_breakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Series Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.series_breakdown.map((series) => (
                <div key={series.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {series.name}
                    </h4>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {series.completion_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${series.completion_percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {series.owned_quarters} / {series.available_quarters} quarters
                  </p>
                  {series.start_year && series.end_year && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {series.start_year} - {series.end_year}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Acquisitions */}
        {stats?.recent_acquisitions && stats.recent_acquisitions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Acquisitions
            </h3>
            <div className="space-y-3">
              {stats.recent_acquisitions.slice(0, 5).map((coin, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    {coin.image_url && (
                      <img 
                        src={coin.image_url} 
                        alt={coin.design}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {coin.year} {coin.design}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {coin.series_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base text-gray-400 dark:text-gray-500">
                      {new Date(coin.acquired_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/collection"
                className="block w-full bg-blue-600 dark:bg-blue-700 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                Browse & Add Quarters
              </Link>
              <Link
                to="/collection?owned=true"
                className="block w-full bg-gray-600 dark:bg-gray-700 text-white text-center py-2 px-4 rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
              >
                View My Collection
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Profile Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make profile public
                </span>
                <button
                  onClick={() => handleProfileVisibilityChange(!profilePublic)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    profilePublic ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      profilePublic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              {profilePublic && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Share your collection:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={getShareUrl()}
                      readOnly
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-md px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={copyShareUrl}
                      className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;