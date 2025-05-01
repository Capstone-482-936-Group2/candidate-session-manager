import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminRoute from './AdminRoute';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock Navigate component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn((props) => null)
}));

describe('AdminRoute', () => {
  // Helper function to render AdminRoute with a test child component
  const renderAdminRoute = () => {
    return render(
      <MemoryRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when authentication is in progress', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      loading: true
    });

    renderAdminRoute();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      loading: false
    });

    renderAdminRoute();

    const { calls } = require('react-router-dom').Navigate.mock;
    expect(calls[0][0]).toEqual({ to: '/login', replace: true });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('redirects to dashboard when user is authenticated but not admin', () => {
    useAuth.mockReturnValue({
      currentUser: { id: 1, name: 'Regular User' },
      isAdmin: false,
      loading: false
    });

    renderAdminRoute();

    const { calls } = require('react-router-dom').Navigate.mock;
    expect(calls[0][0]).toEqual({ to: '/dashboard', replace: true });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders admin content when user is authenticated and is admin', () => {
    useAuth.mockReturnValue({
      currentUser: { id: 1, name: 'Admin User' },
      isAdmin: true,
      loading: false
    });

    renderAdminRoute();

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(require('react-router-dom').Navigate).not.toHaveBeenCalled();
  });

  it('handles transition from loading to admin state', () => {
    // Start with loading state
    useAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      loading: true
    });

    const { rerender } = renderAdminRoute();

    // Verify loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Update to admin state
    useAuth.mockReturnValue({
      currentUser: { id: 1, name: 'Admin User' },
      isAdmin: true,
      loading: false
    });

    rerender(
      <MemoryRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    // Verify admin state
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles transition from loading to non-admin state', () => {
    // Start with loading state
    useAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      loading: true
    });

    const { rerender } = renderAdminRoute();

    // Verify loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Update to non-admin authenticated state
    useAuth.mockReturnValue({
      currentUser: { id: 1, name: 'Regular User' },
      isAdmin: false,
      loading: false
    });

    rerender(
      <MemoryRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    // Verify redirect to dashboard
    const { calls } = require('react-router-dom').Navigate.mock;
    expect(calls[0][0]).toEqual({ to: '/dashboard', replace: true });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles transition from loading to unauthenticated state', () => {
    // Start with loading state
    useAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      loading: true
    });

    const { rerender } = renderAdminRoute();

    // Verify loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Update to unauthenticated state
    useAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      loading: false
    });

    rerender(
      <MemoryRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    // Verify redirect to login
    const { calls } = require('react-router-dom').Navigate.mock;
    expect(calls[0][0]).toEqual({ to: '/login', replace: true });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
