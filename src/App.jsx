import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Collection from './components/Collection';
import PublicProfile from './components/PublicProfile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import InstallButton from './components/InstallButton';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="pb-5 sm:pb-0 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Router>
        {user && <Navbar />}
        {user && <InstallButton />}
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/collection" 
            element={user ? <Collection /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile/:userId" 
            element={<PublicProfile />} 
          />
          <Route 
            path="*" 
            element={<Navigate to={user ? "/" : "/login"} />} 
          />
        </Routes>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
