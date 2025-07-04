import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSun, FaMoon, FaUser, FaTh, FaStar } from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Navbar (desktop only) */}
      <nav className="hidden sm:flex bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/favicon.png" alt="QuarterTracker Logo" className="h-10 w-10 rounded-full" />
              <span className="font-bold text-xl text-gray-900 dark:text-white">QuarterTracker</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/collection"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/collection') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                My Collection
              </Link>
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  // Sun icon for light mode
                  <FaSun className="w-5 h-5" />
                ) : (
                  // Moon icon for dark mode
                  <FaMoon className="w-5 h-5" />
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md px-2 py-1"
                >
                  <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-gray-300 dark:ring-gray-600" />
                  <span className="text-sm font-medium">{user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      View Public Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navbar (mobile only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-inner z-50">
        <div className="flex justify-around items-center h-14">
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center text-sm ${isActive('/') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-300'}`}
          >
            <FaTh className="text-xl" />
            Dashboard
          </Link>
          <Link
            to="/collection"
            className={`flex-1 flex flex-col items-center text-sm ${isActive('/collection') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-300'}`}
          >
            <FaStar className="text-xl" />
            Collection
          </Link>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex-1 flex flex-col items-center text-sm text-gray-500 dark:text-gray-300"
          >
            <FaUser className="text-xl" />
            Profile
          </button>
        </div> 

        {/* Dropdown on mobile (floating modal) */}
        {showDropdown && (
          <div className="absolute bottom-14 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <Link
              to={`/profile/${user.id}`}
              onClick={() => setShowDropdown(false)}
              className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              View Public Profile
            </Link>
            <button
              onClick={toggleDarkMode}
              className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
