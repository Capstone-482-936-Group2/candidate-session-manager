/**
 * Main dashboard component that serves as the home page after user login.
 * Displays a session calendar and provides quick access to role-specific features.
 * Different UI elements are shown based on user role (admin, faculty, or candidate).
 */
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Grid, 
  CircularProgress, 
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } from '../../api/api';
import SessionCalendar from '../calendar/SessionCalendar';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SchoolIcon from '@mui/icons-material/School';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * Dashboard component renders the main page users see after logging in.
 * Shows a calendar of candidate sessions and role-specific navigation options.
 * 
 * @returns {React.ReactNode} Dashboard interface with calendar and role-specific options
 */
const Dashboard = () => {
  const { currentUser, isFaculty, isAdmin } = useAuth();
  const [candidateSections, setCandidateSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  /**
   * Fetches session calendar data when component mounts or user changes
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get all seasons
        const seasonsResponse = await seasonsAPI.getSeasons();
        if (seasonsResponse.data && seasonsResponse.data.length > 0) {
          // Take the most recent season
          const currentSeason = seasonsResponse.data[0];
          
          // Get candidate sections for this season
          const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(currentSeason.id);
          
          // Check if the sections have time slots
          const hasTimeSlots = sectionsResponse.data.some(section => 
            section.time_slots && section.time_slots.length > 0
          );
          
          setCandidateSections(sectionsResponse.data);
        }
      } catch (err) {
        setError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchData();
    }
  }, [currentUser?.id]);

  /**
   * Handles time slot registration for faculty members
   * Refreshes calendar data after successful registration
   * 
   * @param {string|number} timeSlotId - ID of the time slot to register for
   */
  const handleRegister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.registerForTimeSlot(timeSlotId);
      
      // Refresh data
      const seasonsResponse = await seasonsAPI.getSeasons();
      if (seasonsResponse.data && seasonsResponse.data.length > 0) {
        const currentSeason = seasonsResponse.data[0];
        const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(currentSeason.id);
        setCandidateSections(sectionsResponse.data);
      }
    } catch (err) {
      setError('Failed to register for time slot');
    }
  };

  /**
   * Handles time slot unregistration for faculty members
   * Refreshes calendar data after successful unregistration
   * 
   * @param {string|number} timeSlotId - ID of the time slot to unregister from
   */
  const handleUnregister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.unregisterFromTimeSlot(timeSlotId);
      
      // Refresh data
      const seasonsResponse = await seasonsAPI.getSeasons();
      if (seasonsResponse.data && seasonsResponse.data.length > 0) {
        const currentSeason = seasonsResponse.data[0];
        const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(currentSeason.id);
        setCandidateSections(sectionsResponse.data);
      }
    } catch (err) {
      setError('Failed to unregister from time slot');
    }
  };

  // Display loading indicator while fetching data
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Dashboard header with welcome message */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.dark' }}>
          Welcome, {currentUser?.first_name || currentUser?.email}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your session management dashboard
        </Typography>
      </Box>
      
      {/* Error message display */}
      {error && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: '#fdeded', 
            color: '#5f2120',
            border: '1px solid #f5c2c7',
            borderRadius: 2 
          }}
        >
          <Typography fontWeight={500}>{error}</Typography>
        </Paper>
      )}
      
      {/* Main calendar section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card 
            elevation={2}
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: theme.shadows[4],
              }
            }}
          >
            <Box 
              sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center',
                background: 'linear-gradient(45deg, #f5f7fa 0%, #f8f9fb 100%)',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <CalendarMonthIcon sx={{ color: 'primary.main', mr: 1.5 }} />
              <Typography variant="h5" fontWeight={600}>
                Session Calendar
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {candidateSections.length > 0 ? (
                <SessionCalendar 
                  candidateSections={candidateSections}
                  currentUser={currentUser}
                  onRegister={handleRegister}
                  onUnregister={handleUnregister}
                />
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No calendar events found. Check back later!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Role-specific navigation cards (faculty and admin only) */}
      {(isFaculty || isAdmin) && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Faculty-specific navigation card */}
          {isFaculty && (
            <Grid item xs={12} md={6}>
              <Card 
                elevation={2}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  borderLeft: '4px solid',
                  borderColor: 'secondary.main',
                  '&:hover': {
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <SchoolIcon sx={{ color: 'secondary.main', mr: 1.5 }} />
                    <Typography variant="h5" fontWeight={600}>
                      Faculty Options
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Button 
                    component={Link} 
                    to="/faculty-dashboard" 
                    variant="contained" 
                    color="secondary"
                    fullWidth
                    size="large"
                    sx={{ 
                      py: 1.2,
                      borderRadius: 2,
                      boxShadow: 2
                    }}
                  >
                    Go to Faculty Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Admin-specific navigation card */}
          {isAdmin && (
            <Grid item xs={12} md={isFaculty ? 6 : 12}>
              <Card 
                elevation={2}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AdminPanelSettingsIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                    <Typography variant="h5" fontWeight={600}>
                      Admin Options
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Button 
                    component={Link} 
                    to="/admin-dashboard" 
                    variant="contained" 
                    color="primary"
                    fullWidth
                    size="large"
                    sx={{ 
                      py: 1.2,
                      borderRadius: 2,
                      boxShadow: 2
                    }}
                  >
                    Go to Admin Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;