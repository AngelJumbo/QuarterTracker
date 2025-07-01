import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const Collection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [yearFilter, setYearFilter] = useState(searchParams.get('year') || '');
  const [seriesFilter, setSeriesFilter] = useState(searchParams.get('series') || '');
  const [ownedFilter, setOwnedFilter] = useState(searchParams.get('owned') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableSeries, setAvailableSeries] = useState([]);
  const limit = 12;

  useEffect(() => {
    fetchQuarters();
  }, [search, yearFilter, seriesFilter, ownedFilter, page]);
  
  useEffect(() => {
    setPage(1);
  }, [search, yearFilter, seriesFilter, ownedFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (yearFilter) params.set('year', yearFilter);
    if (seriesFilter) params.set('series', seriesFilter);
    if (ownedFilter) params.set('owned', ownedFilter);
    if (page !== 1) params.set('page', page);
    setSearchParams(params);
  }, [search, yearFilter, seriesFilter, ownedFilter, page]);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchQuarters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (yearFilter) params.append('year', yearFilter);
      if (seriesFilter) params.append('series', seriesFilter);
      if (ownedFilter) params.append('owned', ownedFilter);
      params.append('page', page);
      params.append('limit', limit);

      const response = await fetch(`/api/coins/quarters?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        data.quarters.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
        setQuarters(data.quarters);
        setTotalPages(Math.ceil(data.total / limit));
      }
    } catch (error) {
      console.error('Error fetching quarters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeries = async () => {
    try {
      const response = await fetch('/api/coins/quarters/series', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.series)) {
        console.log('Fetched series:', data.series);
        setAvailableSeries(data.series);
      } else {
        setAvailableSeries([]);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      setAvailableSeries([]);
    }
  };

  const toggleQuarterOwnership = async (quarterId, isOwned) => {
    try {
      const url = `/api/coins/quarters/${quarterId}/collect`;
      const method = isOwned ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: method === 'POST' ? JSON.stringify({ condition: 'Good' }) : undefined
      });
      
      if (response.ok) {
        setQuarters(prev => prev.map(quarter => 
          quarter.id === quarterId 
            ? { ...quarter, owned: isOwned ? 0 : 1, condition: isOwned ? null : 'Good' }
            : quarter
        ));
      }
    } catch (error) {
      console.error('Error toggling quarter ownership:', error);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setYearFilter('');
    setSeriesFilter('');
    setOwnedFilter('');
  };

  const getUniqueYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 1999; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2; 
      const range = [];
      const rangeWithDots = [];

      range.push(1);

      for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
        range.push(i);
      }

      if (totalPages > 1) {
        range.push(totalPages);
      }

      const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

      let prev = 0;
      for (const i of uniqueRange) {
        if (i - prev > 1) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(i);
        prev = i;
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="mt-6 px-4">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          {/* Current page info */}
          <div className="text-center mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                page === 1
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                page === totalPages
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500'
              }`}
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Quick jump for mobile (only show if more than 5 pages) */}
          {totalPages > 5 && (
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className={`px-3 py-2 rounded text-sm ${
                  page === 1
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                First
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className={`px-3 py-2 rounded text-sm ${
                  page === totalPages
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Last
              </button>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex justify-center items-center">
          <div className="flex items-center space-x-1">
            {/* Previous button */}
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`min-w-[44px] h-11 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                page === 1
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {visiblePages.map((pageNum, index) => (
              pageNum === '...' ? (
                <span
                  key={`dots-${index}`}
                  className="min-w-[44px] h-11 px-3 py-2 flex items-center justify-center text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[44px] h-11 px-3 py-2 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500'
                  }`}
                >
                  {pageNum}
                </button>
              )
            ))}

            {/* Next button */}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`min-w-[44px] h-11 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                page === totalPages
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quarter Collection</h1>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search design, series..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                {getUniqueYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Series
              </label>
              <select
                value={seriesFilter}
                onChange={(e) => setSeriesFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Series</option>
                {availableSeries.map(series => (
                  <option key={series.name} value={series.name}>{series.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ownership
              </label>
              <select
                value={ownedFilter}
                onChange={(e) => setOwnedFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Quarters</option>
                <option value="true">Owned Only</option>
                <option value="false">Not Owned</option>
              </select>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear all filters
          </button>
        </div>

        {/* Quarters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quarters.map((quarter) => (
            <div
              key={quarter.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 flex flex-col justify-between ${
                quarter.owned ? 'ring-2 ring-green-500 dark:ring-green-400' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {quarter.year} {quarter.design}
                  </h3>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  quarter.owned 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {quarter.owned ? 'Owned' : 'Not Owned'}
                </div>
              </div>

              <div className=" flex flex-row justify-between h-full pb-4">
                <div className=" flex flex-col justify-between h-full w-60">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                    {quarter.series} {quarter.mint_mark?`• Mint: ${quarter.mint_mark}`:""}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {quarter.description}
                  </p>

                  {quarter.mintage && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      Mintage: {quarter.mintage.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className=" flex flex-col justify-between h-full w-40">
                  {quarter.image_url && <img src={`${quarter.image_url}`} className='w-100 object-contain'/>}
                </div>
              </div>


              <button
                onClick={() => toggleQuarterOwnership(quarter.id, quarter.owned)}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors justify-self-end ${
                  quarter.owned
                    ? 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                }`}
              >
                {quarter.owned ? 'Remove from Collection' : 'Add to Collection'}
              </button>
            </div>
          ))}
        </div>

        {quarters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No quarters found</h3>
              <p>Try adjusting your filters to see more results.</p>
            </div>
          </div>
        )}
        
        {renderPagination()}

      </div>
    </div>
  );
};

export default Collection;