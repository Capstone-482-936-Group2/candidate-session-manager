/**
 * Authentication context provider that manages user authentication state.
 * Handles login/logout, user role determination, and initial setup flows for different user types.
 * Stores authentication state in localStorage for persistence across page refreshes.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/api';
import CandidateSetupForm from '../components/candidate/CandidateSetupForm';
import RoomSetupDialog from '../components/auth/RoomSetupDialog';

// Create authentication context
export const AuthContext = createContext();

/**
 * Custom hook to access the auth context from any component
 * @returns {Object} Authentication context value
 */
export const useAuth = () => useContext(AuthContext);

/**
 * Authentication provider component that wraps the application.
 * Manages user state, authentication, and initial setup flows.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {React.ReactNode} Auth provider with children
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Setup dialog states
  const [showCandidateSetup, setShowCandidateSetup] = useState(false);
  const [showRoomSetup, setShowRoomSetup] = useState(false);

  /**
   * Stores authentication state in localStorage
   * @param {Object|null} user - User object to store or null to clear
   */
  const storeAuthState = (user) => {
    if (user) {
      localStorage.setItem('authState', JSON.stringify(user));
    } else {
      localStorage.removeItem('authState');
    }
  };

  /**
   * Loads authentication state from localStorage
   * @returns {Object|null} Stored user object or null
   */
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

  /**
   * Checks if the user needs to complete setup based on their user type
   * Shows appropriate setup dialog if needed
   * 
   * @param {Object} user - User object to check
   */
  const checkUserSetupNeeds = (user) => {
    if (!user) return;
    
    // If user has completed setup, make sure setup forms are closed
    if (user.has_completed_setup) {
      setShowCandidateSetup(false);
      setShowRoomSetup(false);
      return;
    }
    
    if (user.user_type === 'candidate') {
      setShowCandidateSetup(true);
    } else if (['faculty', 'admin', 'superadmin'].includes(user.user_type)) {
      setShowRoomSetup(true);
    }
  };

  /**
   * Effect to load user on mount and listen for storage changes
   * Ensures authentication state is synced across tabs
   */
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

  /**
   * Handles login with Google OAuth
   * 
   * @param {string} accessToken - Google OAuth access token
   * @returns {Object} User data on successful login
   * @throws {Error} On login failure
   */
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

  /**
   * Handles user logout
   * Clears user data and setup states
   * 
   * @throws {Error} On logout failure
   */
  const logout = async () => {
    try {
      await authAPI.logout();
      setCurrentUser(null);
      storeAuthState(null);
      setShowCandidateSetup(false);
      setShowRoomSetup(false);
      sessionStorage.clear(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Logout failed');
      throw err;
    }
  };

  /**
   * Handles user registration
   * 
   * @param {Object} userData - User registration data
   * @returns {Object} Registration response data
   * @throws {Error} On registration failure
   */
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

  /**
   * Updates user data after room setup completion
   * 
   * @param {string} roomNumber - Room/office number entered by the user
   */
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

  // Context value containing authentication state and functions
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
      
      {/* Setup dialogs shown conditionally based on user type and setup status */}
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
