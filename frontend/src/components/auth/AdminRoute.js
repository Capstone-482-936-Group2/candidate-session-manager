import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * Protected route component that only allows access to authenticated admin users.
 * Redirects to login page if user is not authenticated.
 * Redirects to dashboard if user is authenticated but not an admin.
 * Shows a loading spinner while authentication state is being determined.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if user has admin access
 * @returns {React.ReactNode} The protected route component
 */
const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if user is not an admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if user is authenticated and is an admin
  return children;
};

export default AdminRoute; 