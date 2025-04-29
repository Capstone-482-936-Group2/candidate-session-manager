import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading indicator when loading is true', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true,
      isCandidate: false,
      isFaculty: false,
      isAdmin: false,
      isSuperAdmin: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('redirects to login page if user is not authenticated', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false,
      isCandidate: false,
      isFaculty: false,
      isAdmin: false,
      isSuperAdmin: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="*" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('redirects to unauthorized page if user lacks required role', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'candidate' },
      loading: false,
      isCandidate: true,
      isFaculty: false,
      isAdmin: false,
      isSuperAdmin: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin-dashboard']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route path="*" element={<ProtectedRoute requiredRole="admin" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  test('redirects candidate from /dashboard to /forms', async () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'candidate' },
      loading: false,
      isCandidate: true,
      isFaculty: false,
      isAdmin: false,
      isSuperAdmin: false,
    });
  
    // Mock window.location.pathname manually
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/dashboard' },
    });
  
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/forms" element={
            <>
              <LocationDisplay />
              <div>Forms Page</div>
            </>
          } />
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route index element={
              <>
                <LocationDisplay />
                <div>Dashboard Content</div>
              </>
            } />
          </Route>
          <Route path="/login" element={
            <>
              <LocationDisplay />
              <div>Login Page</div>
            </>
          } />
          <Route path="/" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );
  
    // ✅ Just wait for redirect
    await waitFor(() => {
      const locationDisplay = screen.getByTestId('location-display');
      expect(locationDisplay).toHaveTextContent('/forms');
    }, { timeout: 2000 });
  
    // ✅ Confirm forms page content is shown
    expect(screen.getByText('Forms Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });
  test('allows faculty user to access protected route and renders outlet content', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty' },
      loading: false,
      isCandidate: false,
      isFaculty: true,
      isAdmin: false,
      isSuperAdmin: false,
    });
  
    render(
      <MemoryRouter initialEntries={['/faculty-dashboard']}>
        <Routes>
          <Route path="/faculty-dashboard" element={<ProtectedRoute requiredRole="faculty" />}>
            <Route index element={<div>Faculty Dashboard Content</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(screen.getByText('Faculty Dashboard Content')).toBeInTheDocument();
  });
  test('allows admin user to access a route requiring faculty role', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'admin' },
      loading: false,
      isCandidate: false,
      isFaculty: false,
      isAdmin: true,
      isSuperAdmin: false,
    });
  
    render(
      <MemoryRouter initialEntries={['/faculty-page']}>
        <Routes>
          <Route path="/faculty-page" element={<ProtectedRoute requiredRole="faculty" />}>
            <Route index element={<div>Faculty Page Content</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(screen.getByText('Faculty Page Content')).toBeInTheDocument();
  });
  test('redirects to unauthorized page if requiredRole is unknown', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'admin' },
      loading: false,
      isCandidate: false,
      isFaculty: false,
      isAdmin: true,
      isSuperAdmin: false,
    });
  
    render(
      <MemoryRouter initialEntries={['/unknown-role-page']}>
        <Routes>
          <Route path="/unknown-role-page" element={<ProtectedRoute requiredRole="wizard" />}>
            <Route index element={<div>Wizard Page Content</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });
  test('allows any authenticated user to access if no requiredRole is specified', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'candidate' },
      loading: false,
      isCandidate: true,
      isFaculty: false,
      isAdmin: false,
      isSuperAdmin: false,
    });
  
    // 👇 Mock window.location.pathname manually to match MemoryRouter initial entry
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/open-page' },
    });
  
    render(
      <MemoryRouter initialEntries={['/open-page']}>
        <Routes>
          {/* Outer route using ProtectedRoute */}
          <Route path="/open-page" element={<ProtectedRoute />}>
            <Route index element={<div>Open Page Content</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(screen.getByText('Open Page Content')).toBeInTheDocument();
  });
  test('redirects unauthenticated user to login even if no requiredRole is specified', () => {
    useAuth.mockReturnValue({
      currentUser: null, // ❗ User is not logged in
      loading: false,
      isCandidate: false,
      isFaculty: false,
      isAdmin: false,
      isSuperAdmin: false,
    });
  
    // Mock window.location.pathname manually
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/open-page' },
    });
  
    render(
      <MemoryRouter initialEntries={['/open-page']}>
        <Routes>
          {/* Protected route but no requiredRole */}
          <Route path="/open-page" element={<ProtectedRoute />}>
            <Route index element={<div>Open Page Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    // ✅ The user should see "Login Page" because they got redirected
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
  test('allows admin user to access a route requiring admin role', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'admin' },
      loading: false,
      isCandidate: false,
      isFaculty: false,
      isAdmin: true,     // ✅ Admin is true
      isSuperAdmin: false,
    });
  
    render(
      <MemoryRouter initialEntries={['/admin-dashboard']}>
        <Routes>
          <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="admin" />}>
            <Route index element={<div>Admin Dashboard Content</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(screen.getByText('Admin Dashboard Content')).toBeInTheDocument(); // ✅ allowed
  });
    
  test('redirects faculty user to unauthorized when accessing admin route', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty' },
      loading: false,
      isCandidate: false,
      isFaculty: true,    // ❌ Only faculty
      isAdmin: false,
      isSuperAdmin: false,
    });
  
    render(
      <MemoryRouter initialEntries={['/admin-page']}>
        <Routes>
          <Route path="/admin-page" element={<ProtectedRoute requiredRole="admin" />}>
            <Route index element={<div>Admin Page Content</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument(); // ✅ denied
  });
  
  
});
