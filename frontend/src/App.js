import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Auth provider
import { AuthProvider } from './context/AuthContext';

// Components
import Navigation from './components/shared/Navigation';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/shared/Dashboard';
import FacultyDashboard from './components/faculty/FacultyDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import RecruitingSeasons from './components/seasons/RecruitingSeasons';
import CandidateSectionManagement from './components/admin/CandidateSectionManagement';
import ProtectedRoute from './components/shared/ProtectedRoute';
import RecruitingSeasonManagement from './components/admin/RecruitingSeasonManagement';
import TimeSlotTemplateManagement from './components/admin/TimeSlotTemplateManagement';
import UserDashboard from './components/dashboard/UserDashboard';
import UserForms from './components/forms/UserForms';
import FormSubmissionPage from './components/forms/FormSubmissionPage';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import FormManagement from './pages/FormManagement';
import FacultyAvailabilityForm from './components/faculty/FacultyAvailabilityForm';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#500000', // Texas A&M maroon
      light: '#7f2b2b',
      dark: '#370000',
    },
    secondary: {
      main: '#5c068c', // More vibrant secondary color
      light: '#8c34bd',
      dark: '#3b005e',
    },
    background: {
      default: '#f8f8f8',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    // ... more shadow definitions if needed
  ],
});


// Google Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <Router>
              <Navigation />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute requiredRole="candidate" />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/seasons" element={<RecruitingSeasons />} />
                </Route>
                
                <Route element={<ProtectedRoute requiredRole="faculty" />}>
                  <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
                </Route>
                
                <Route element={<ProtectedRoute requiredRole="admin" />}>
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/admin-dashboard/season/:seasonId/candidates" element={<CandidateSectionManagement />} />
                  <Route path="/admin-dashboard/season/:seasonId/management" element={<RecruitingSeasonManagement />} />
                  <Route path="/admin-dashboard/form-management" element={<FormManagement />} />
                </Route>
                
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <UserDashboard />
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/forms"
                  element={
                    <PrivateRoute>
                      <UserForms />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/forms/:formId"
                  element={
                    <PrivateRoute>
                      <FormSubmissionPage />
                    </PrivateRoute>
                  }
                />
                
                <Route 
                  path="/faculty-availability" 
                  element={
                    <PrivateRoute allowedRoles={['faculty', 'admin', 'superadmin']}>
                      <FacultyAvailabilityForm />
                    </PrivateRoute>
                  } 
                />
                
                {/* Redirect root to dashboard or login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
