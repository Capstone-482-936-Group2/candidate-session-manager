import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/api';
import CandidateSetupForm from '../components/candidate/CandidateSetupForm';
import RoomSetupDialog from '../components/auth/RoomSetupDialog';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add states for setup windows
  const [showCandidateSetup, setShowCandidateSetup] = useState(false);
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

  // Function to check if user needs setup
  const checkUserSetupNeeds = (user) => {
    if (!user || user.has_completed_setup) return;
    
    if (user.user_type === 'candidate') {
      setShowCandidateSetup(true);
    } else if (['faculty', 'admin', 'superadmin'].includes(user.user_type)) {
      setShowRoomSetup(true);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        // First check localStorage for existing auth state
        const storedUser = loadAuthState();
        if (storedUser) {
          setCurrentUser(storedUser);
          checkUserSetupNeeds(storedUser);
        }

        // Then verify with the server
        const response = await authAPI.getCurrentUser();
        const user = response.data;
        setCurrentUser(user);
        storeAuthState(user);
        checkUserSetupNeeds(user);
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
        if (newUser) {
          checkUserSetupNeeds(newUser);
        }
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
      setCurrentUser(user);
      storeAuthState(user);
      checkUserSetupNeeds(user);
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
      setShowCandidateSetup(false);
      setShowRoomSetup(false);
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

  // Handler for room setup completion
  const handleRoomSetupComplete = (roomNumber) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        room_number: roomNumber,
        has_completed_setup: true
      });
      storeAuthState({
        ...currentUser,
        room_number: roomNumber,
        has_completed_setup: true
      });
      setShowRoomSetup(false);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    loginWithGoogle,
    logout,
    register,
    error,
    loading,
    isCandidate: currentUser?.user_type === 'candidate',
    isFaculty: ['faculty', 'admin', 'superadmin'].includes(currentUser?.user_type),
    isAdmin: ['admin', 'superadmin'].includes(currentUser?.user_type),
    isSuperAdmin: currentUser?.user_type === 'superadmin',
    setShowCandidateSetup,
    user: currentUser, // Added for component compatibility
    setUser: setCurrentUser, // Added for component compatibility
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Show setup dialogs when needed */}
      {showCandidateSetup && currentUser && <CandidateSetupForm />}
      {showRoomSetup && currentUser && (
        <RoomSetupDialog 
          open={showRoomSetup} 
          currentRoomNumber={currentUser.room_number} 
          onComplete={handleRoomSetupComplete} 
        />
      )}
    </AuthContext.Provider>
  );
};
