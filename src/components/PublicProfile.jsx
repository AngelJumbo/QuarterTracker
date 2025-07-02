import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('collection'); // 'collection', 'series'

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/profile/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setError(null);
      } else if (response.status === 404) {
        setError('User not found');
      } else if (response.status === 403) {
        setError('This profile is private');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  const groupCollectionBySeries = (collection) => {
    const grouped = collection.reduce((acc, coin) => {
      if (!acc[coin.series_name]) {
        acc[coin.series_name] = [];
      }
      acc[coin.series_name].push(coin);
      return acc;
    }, {});

    Object.keys(grouped).forEach(series => {
      grouped[series].sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    });
    console.log("grup",grouped);

    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchProfile}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const { user, collection, stats } = profile;
  const groupedCollection = groupCollectionBySeries(collection);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.owned_quarters} coins collected
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {((stats.owned_quarters / stats.total_quarters_available) * 100).toFixed(1)}% complete
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex justify-between sm:justify-normal border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'collection', label: 'Collection' },
              { key: 'series', label: 'Series Progress' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`px-6 py-4 font-medium text-sm w-full sm:w-auto ${
                  viewMode === tab.key
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collection Tab */}
        {viewMode === 'collection' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Collection ({collection.length} coins)</h2>
            
            {Object.entries(groupedCollection).map(([seriesName, coins]) => (
              <div key={seriesName} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                  {seriesName} ({coins.length} coins)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {coins.map((coin) => (
                    <div key={coin.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-700 transition-shadow bg-white dark:bg-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{coin.design}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{coin.year}</div>
                      {coin.mint_mark && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Mint: {coin.mint_mark}</div>
                      )}
                      <div className="mt-2">
                        <img src={coin.image_url} alt={coin.design} className="w-full h-full object-cover rounded-lg mb-2" />
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Added: {formatDate(coin.acquired_date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Series Progress Tab */}
        {viewMode === 'series' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Series Progress</h2>
            <div className="space-y-4">
              {stats.series_breakdown.map((series) => (
                <div key={series.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{series.name}</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {series.owned_quarters}/{series.available_quarters} ({series.completion_percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${series.completion_percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total coins in series: {series.total_coins}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicProfile;