import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setUser(null);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUserSettings = async (settings) => {
    try {
      const response = await fetch('/api/user/profile-visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setUser(prev => ({
          ...prev,
          profile_public: settings.isPublic !== undefined ? settings.isPublic : prev.profile_public,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user settings:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUserSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};