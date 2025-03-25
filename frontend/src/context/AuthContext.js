import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        setCurrentUser(response.data);
      } catch (err) {
        console.log('Not authenticated');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const loginWithGoogle = async (accessToken) => {
    setError(null);
    try {
      const response = await authAPI.googleLogin(accessToken);
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setCurrentUser(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Logout failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
      throw err;
    }
  };

  const value = {
    currentUser,
    loginWithGoogle,
    logout,
    register,
    error,
    loading,
    isCandidate: currentUser?.user_type === 'candidate',
    isFaculty: ['faculty', 'admin', 'superadmin'].includes(currentUser?.user_type),
    isAdmin: ['admin', 'superadmin'].includes(currentUser?.user_type),
    isSuperAdmin: currentUser?.user_type === 'superadmin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
