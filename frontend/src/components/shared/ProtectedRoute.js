/**
 * Route protection component that restricts access based on authentication status and user role.
 * Redirects unauthenticated users to login and unauthorized users to an error page.
 * Implements role-based access control for different user types (candidate, faculty, admin, superadmin).
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute component enforces authentication and role-based access control.
 * Uses React Router's Outlet pattern to render child routes when access is granted.
 * 
 * @param {Object} props - Component props
 * @param {string} props.requiredRole - Required role to access the route ('candidate', 'faculty', 'admin', 'superadmin')
 * @returns {React.ReactNode} Outlet for child routes or Navigate for redirection
 */
const ProtectedRoute = ({ requiredRole }) => {
  const { currentUser, loading, isCandidate, isFaculty, isAdmin, isSuperAdmin } = useAuth();
  
  // Show loading state while authentication status is being determined
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login page if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Check role requirements if a specific role is required for this route
  if (requiredRole) {
    let hasAccess = false;
    
    // Determine access based on role hierarchy
    // Higher roles have access to lower role routes (e.g., admin can access faculty routes)
    switch (requiredRole) {
      case 'candidate':
        hasAccess = isCandidate || isFaculty || isAdmin || isSuperAdmin;
        break;
      case 'faculty':
        hasAccess = isFaculty || isAdmin || isSuperAdmin;
        break;
      case 'admin':
        hasAccess = isAdmin || isSuperAdmin;
        break;
      case 'superadmin':
        hasAccess = isSuperAdmin;
        break;
      default:
        hasAccess = false;
    }
    
    // Redirect to unauthorized page if user doesn't have the required role
    if (!hasAccess) {
      return <Navigate to="/unauthorized" />;
    }
  }
  
  // Special case: redirect candidates from dashboard to forms page
  // This ensures candidates see the more relevant forms page as their main view
  if (currentUser.user_type === 'candidate' && window.location.pathname === '/dashboard') {
    return <Navigate to="/forms" replace />;
  }
  
  // If all checks pass, render the protected route's children
  return <Outlet />;
};

export default ProtectedRoute;