import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, usersAPI } from '../api/api';
import RoomSetupDialog from '../components/auth/RoomSetupDialog';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRoomSetup, setShowRoomSetup] = useState(false);

  // Function to store auth state in localStorage
  const storeAuthState = (user) => {
    if (user) {
      localStorage.setItem('authState', JSON.stringify(user));
    } else {
      localStorage.removeItem('authState');
    }
  };

  // Function to load auth state from localStorage
  const loadAuthState = () => {
    const storedAuth = localStorage.getItem('authState');
    if (storedAuth) {
      try {
        return JSON.parse(storedAuth);
      } catch (e) {
        console.error('Error parsing stored auth state:', e);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        // First check localStorage for existing auth state
        const storedUser = loadAuthState();
        if (storedUser) {
          setCurrentUser(storedUser);
        }

        // Then verify with the server
        const response = await authAPI.getCurrentUser();
        const user = response.data;
        
        // Only show setup dialog if needed and not already completed
        if (user.user_type !== 'candidate' && !user.has_completed_setup) {
          setShowRoomSetup(true);
        } else {
          setShowRoomSetup(false);
        }
        
        setCurrentUser(user);
        storeAuthState(user);
      } catch (err) {
        console.log('Not authenticated');
        setCurrentUser(null);
        storeAuthState(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for storage events to sync auth state across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'authState') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        setCurrentUser(newUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loginWithGoogle = async (accessToken) => {
    setError(null);
    try {
      const response = await authAPI.googleLogin(accessToken);
      const user = response.data;
      
      // Check if room setup is needed only for faculty/admin/superadmin who haven't completed setup
      if (user.user_type !== 'candidate' && !user.has_completed_setup) {
        setShowRoomSetup(true);
      } else {
        setShowRoomSetup(false);  // Ensure dialog is closed for other cases
      }
      
      setCurrentUser(user);
      storeAuthState(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setCurrentUser(null);
      storeAuthState(null);
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

  const handleRoomSetupComplete = async (roomNumber) => {
    try {
      const response = await usersAPI.completeRoomSetup(roomNumber);
      const updatedUser = response.data;
      setCurrentUser(updatedUser);
      storeAuthState(updatedUser);  // Make sure to update localStorage
      setShowRoomSetup(false);
    } catch (err) {
      console.error('Error completing room setup:', err);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
      <RoomSetupDialog
        open={showRoomSetup}
        currentRoomNumber={currentUser?.room_number}
        onComplete={handleRoomSetupComplete}
      />
    </AuthContext.Provider>
  );
};
