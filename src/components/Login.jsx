import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaGoogle } from "react-icons/fa";


const Login = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto rounded-full flex items-center justify-center">
            <img src="/favicon.png" className='h-[20rem]' alt="QuarterTracker Logo" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to QuarterTracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Track your quarter collection
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm">
            <button
              onClick={login}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
            >
              <FaGoogle className="w-5 h-5 mr-2" />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;