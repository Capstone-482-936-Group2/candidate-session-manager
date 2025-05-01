import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PrivateRoute from './PrivateRoute';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock Navigate component more precisely
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn((props) => null) // Mock that accepts props parameter
}));

describe('PrivateRoute', () => {
  // Helper function to render PrivateRoute with a test child component
  const renderPrivateRoute = () => {
    return render(
      <MemoryRouter>
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when authentication is in progress', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });

    renderPrivateRoute();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false
    });

    renderPrivateRoute();

    // Check that Navigate was called with the correct props
    const { calls } = require('react-router-dom').Navigate.mock;
    expect(calls[0][0]).toEqual({ to: '/login', replace: true });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders protected content when user is authenticated', () => {
    useAuth.mockReturnValue({
      currentUser: { id: 1, name: 'Test User' },
      loading: false
    });

    renderPrivateRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(require('react-router-dom').Navigate).not.toHaveBeenCalled();
  });

  it('handles transition from loading to authenticated state', () => {
    // Start with loading state
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });

    const { rerender } = renderPrivateRoute();

    // Verify loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Update to authenticated state
    useAuth.mockReturnValue({
      currentUser: { id: 1, name: 'Test User' },
      loading: false
    });

    rerender(
      <MemoryRouter>
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    // Verify authenticated state
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles transition from loading to unauthenticated state', () => {
    // Start with loading state
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });

    const { rerender } = renderPrivateRoute();

    // Verify loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Update to unauthenticated state
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false
    });

    rerender(
      <MemoryRouter>
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    // Verify redirect to login using mock calls
    const { calls } = require('react-router-dom').Navigate.mock;
    expect(calls[0][0]).toEqual({ to: '/login', replace: true });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
