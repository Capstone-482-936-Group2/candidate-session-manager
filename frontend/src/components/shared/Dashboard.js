import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Button, Grid, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { seasonsAPI, candidateSectionsAPI } from '../../api/api';
import SessionCalendar from '../calendar/SessionCalendar'; // Updated import

const Dashboard = () => {
  const { currentUser, isFaculty, isAdmin } = useAuth();
  const [candidateSections, setCandidateSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          console.log('Dashboard - Candidate sections:', sectionsResponse.data);
          // Check if the sections have time slots
          const hasTimeSlots = sectionsResponse.data.some(section => 
            section.time_slots && section.time_slots.length > 0
          );
          console.log('Dashboard - Has time slots:', hasTimeSlots);
          setCandidateSections(sectionsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchData();
    }
  }, [currentUser?.id]);

  // Handle register and unregister (if faculty)
  const handleRegister = async (timeSlotId) => {
    // If needed, implement registration logic here
  };

  const handleUnregister = async (timeSlotId) => {
    // If needed, implement unregistration logic here
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {currentUser?.email}
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Session Calendar
            </Typography>
            {candidateSections.length > 0 ? (
              <SessionCalendar 
                candidateSections={candidateSections}
                currentUser={currentUser}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
              />
            ) : (
              <Typography>No calendar events found. Check back later!</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {isFaculty && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            Faculty Options
          </Typography>
          <Button 
            component={Link} 
            to="/faculty-dashboard" 
            variant="contained" 
            color="primary"
          >
            Go to Faculty Dashboard
          </Button>
        </Paper>
      )}
      
      {isAdmin && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            Admin Options
          </Typography>
          <Button 
            component={Link} 
            to="/admin-dashboard" 
            variant="contained" 
            color="primary"
          >
            Go to Admin Dashboard
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;