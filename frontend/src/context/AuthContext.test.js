// frontend/src/context/AuthContext.test.js
// ✅ MOCK FIRST, BEFORE IMPORTS
jest.mock('../api/api', () => ({
    authAPI: {
      getCurrentUser: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          first_name: 'Test',
          last_name: 'User',
          user_type: 'candidate',
          has_completed_setup: true,
        }
      }),
      googleLogin: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    }
  }));
  
  import React from 'react';
  import { render, screen, waitFor, act } from '@testing-library/react';
  import { AuthProvider, useAuth } from './AuthContext';
  
  describe('AuthContext', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      localStorage.clear();
    });
  
    test('provides authentication state to children', () => {
      const TestComponent = () => {
        const { currentUser } = useAuth();
        return <div data-testid="test">{currentUser ? 'logged in' : 'logged out'}</div>;
      };
  
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
  
      expect(getByTestId('test')).toHaveTextContent('logged out');
    });
    test('handles logout correctly', async () => {
        const { authAPI } = require('../api/api');
        
        // Mock logout API success
        authAPI.logout.mockResolvedValueOnce({});
        
        // Mock getCurrentUser API success
        authAPI.getCurrentUser.mockResolvedValueOnce({
          data: {
            id: 1,
            first_name: 'Test',
            last_name: 'User',
            user_type: 'candidate',
            has_completed_setup: true,
          }
        });
      
        // Set up initial localStorage authState
        const initialUser = {
          id: 1,
          first_name: 'Test',
          last_name: 'User',
          user_type: 'candidate',
          has_completed_setup: true,
        };
        localStorage.setItem('authState', JSON.stringify(initialUser));
      
        const TestComponent = () => {
          const { currentUser, loading, logout } = useAuth();
          if (loading) return <div data-testid="loading">Loading...</div>;
          return (
            <div>
              <div data-testid="auth-status">
                {currentUser ? `Logged in as ${currentUser.first_name}` : 'Logged out'}
              </div>
              <button 
                data-testid="logout-button" 
                onClick={logout}
                disabled={!currentUser}
              >
                Logout
              </button>
            </div>
          );
        };
      
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      
        // 🛠️ Wait for loading to finish (important because getCurrentUser runs)
        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
      
        // ✅ Now check logged in user
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as Test');
      
        // 🔥 Now click logout
        const logoutButton = screen.getByTestId('logout-button');
        await act(async () => {
          logoutButton.click();
        });
      
        // ✅ Verify logout API called
        expect(authAPI.logout).toHaveBeenCalled();
      
        // ✅ Verify logged out
        await waitFor(() => {
          expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged out');
        });
      
        // ✅ Verify logout button is disabled
        expect(logoutButton).toBeDisabled();
      
        // ✅ Verify localStorage cleared
        expect(localStorage.getItem('authState')).toBeNull();
      
        // ✅ Verify sessionStorage cleared
        expect(sessionStorage.length).toBe(0);
      });
      test('syncs auth state across tabs via storage event', async () => {
        const newUser = {
          id: 2,
          first_name: 'Other',
          last_name: 'User',
          user_type: 'admin',
          has_completed_setup: true,
        };
      
        const TestComponent = () => {
          const { currentUser, loading } = useAuth();
          if (loading) return <div data-testid="loading">Loading...</div>;
          return (
            <div data-testid="auth-status">
              {currentUser ? `Logged in as ${currentUser.first_name}` : 'Logged out'}
            </div>
          );
        };
      
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      
        // Wait for initial loading to finish
        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
      
        // Initially should be logged out
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged out');
      
        // Simulate a storage event like another tab setting authState
        await act(async () => {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: 'authState',
              newValue: JSON.stringify(newUser),
            })
          );
        });
      
        // Should now see new user reflected
        await waitFor(() => {
          expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as Other');
        });
      });
      test('handles Google login failure correctly', async () => {
        const { authAPI } = require('../api/api');
      
        // Mock a failed googleLogin response
        authAPI.googleLogin.mockRejectedValueOnce({
          response: { data: { error: 'Invalid credentials' } }
        });
      
        const TestComponent = () => {
          const { currentUser, loading, error, loginWithGoogle } = useAuth();
          if (loading) return <div data-testid="loading">Loading...</div>;
          return (
            <div>
              <div data-testid="auth-status">
                {currentUser ? `Logged in as ${currentUser.first_name}` : 'Logged out'}
              </div>
              <div data-testid="error-message">
                {error ? error : 'No error'}
              </div>
              <button 
                data-testid="google-login-button" 
                onClick={async () => {
                  try {
                    await loginWithGoogle('invalid-access-token');
                  } catch (_) {
                    // Expected error, ignore
                  }
                }}
              >
                Login with Google
              </button>
            </div>
          );
        };
      
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      
        // 🔥 WAIT for loading to disappear before checking anything
        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
      
        // ✅ Now safely check
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged out');
        expect(screen.getByTestId('error-message')).toHaveTextContent('No error');
      
        // Click Google login button
        const googleLoginButton = screen.getByTestId('google-login-button');
        await act(async () => {
          googleLoginButton.click();
        });
      
        // Now error should appear
        await waitFor(() => {
          expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
        });
      
        // Confirm still logged out
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged out');
      });
      test('handles registration failure correctly', async () => {
        const { authAPI } = require('../api/api');
      
        // Mock a failed register API response
        authAPI.register.mockRejectedValueOnce({
          response: { data: 'Email already exists' }
        });
      
        const TestComponent = () => {
          const { currentUser, loading, error, register } = useAuth();
          if (loading) return <div data-testid="loading">Loading...</div>;
          return (
            <div>
              <div data-testid="auth-status">
                {currentUser ? `Logged in as ${currentUser.first_name}` : 'Logged out'}
              </div>
              <div data-testid="error-message">
                {error ? error : 'No error'}
              </div>
              <button 
                data-testid="register-button" 
                onClick={async () => {
                  try {
                    await register({ email: 'test@example.com', password: 'password' });
                  } catch (_) {
                    // Expected failure, ignore
                  }
                }}
              >
                Register
              </button>
            </div>
          );
        };
      
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      
        // Wait for loading to finish
        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
      
        // Initially logged out and no error
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged out');
        expect(screen.getByTestId('error-message')).toHaveTextContent('No error');
      
        // Click register button
        const registerButton = screen.getByTestId('register-button');
        await act(async () => {
          registerButton.click();
        });
      
        // Now error should appear
        await waitFor(() => {
          expect(screen.getByTestId('error-message')).toHaveTextContent('Email already exists');
        });
      
        // Confirm still logged out
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged out');
      });
      test('handles corrupted localStorage without crashing', async () => {
        // Set up corrupted JSON in localStorage
        localStorage.setItem('authState', 'this-is-not-json');
      
        const TestComponent = () => {
          const { currentUser, loading } = useAuth();
          if (loading) return <div data-testid="loading">Loading...</div>;
          return (
            <div data-testid="auth-status">
              {currentUser ? `Logged in as ${currentUser.first_name}` : 'Logged out'}
            </div>
          );
        };
      
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      
        // Wait for loading to finish
        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
      
        // ✅ Should handle corrupted localStorage and be logged out
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged out');
      });
      test('shows CandidateSetupForm for candidates who have not completed setup', async () => {
        const { authAPI } = require('../api/api');
      
        // Mock getCurrentUser API to return an incomplete candidate user
        authAPI.getCurrentUser.mockResolvedValueOnce({
          data: {
            id: 3,
            first_name: 'Candidate',
            last_name: 'User',
            user_type: 'candidate',
            has_completed_setup: false,
          }
        });
      
        const TestComponent = () => {
          const { loading } = useAuth();
          if (loading) return <div data-testid="loading">Loading...</div>;
          return <div data-testid="content">Normal Content</div>;
        };
      
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      
        // Wait for loading to finish
        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
      
        // ✅ CandidateSetupForm should appear
        expect(screen.getByText(/Candidate Setup/i)).toBeInTheDocument();
      });
      
  });