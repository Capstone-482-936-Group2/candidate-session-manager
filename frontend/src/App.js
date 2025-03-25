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

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
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
                </Route>
                
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
