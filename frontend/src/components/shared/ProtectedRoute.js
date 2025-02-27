import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ requiredRole }) => {
  const { currentUser, loading, isCandidate, isFaculty, isAdmin, isSuperAdmin } = useAuth();
  
  // Check if authentication is still loading
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Check role requirements if specified
  if (requiredRole) {
    let hasAccess = false;
    
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
    
    if (!hasAccess) {
      return <Navigate to="/unauthorized" />;
    }
  }
  
  return <Outlet />;
};

export default ProtectedRoute;