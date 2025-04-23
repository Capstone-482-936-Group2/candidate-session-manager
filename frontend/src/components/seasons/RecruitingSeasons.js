/**
 * Component that displays recruiting seasons and their associated candidate sections.
 * Allows users to view available time slots and register/unregister for candidate sessions.
 */
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Box, Grid, Card, CardContent, 
  CardActions, Button, Divider, Chip, List, ListItem, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

/**
 * RecruitingSeasons component displays all recruiting seasons and their candidate sections.
 * Users can view time slots and register/unregister for candidate sessions.
 * 
 * @returns {React.ReactNode} List of recruiting seasons with candidate sections
 */
const RecruitingSeasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [candidateSections, setCandidateSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  const { currentUser } = useAuth();

  /**
   * Fetches recruiting seasons and their associated candidate sections on component mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all recruiting seasons
        const seasonsResponse = await seasonsAPI.getSeasons();
        setSeasons(seasonsResponse.data);
        
        // Fetch candidate sections for each season
        const sectionsPromises = seasonsResponse.data.map(season => 
          candidateSectionsAPI.getCandidateSectionsBySeason(season.id)
        );
        
        const sectionsResponses = await Promise.all(sectionsPromises);
        const allSections = sectionsResponses.flatMap(response => response.data);
        setCandidateSections(allSections);
      } catch (err) {
        setError('Failed to load recruiting seasons data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Handles registration for a time slot.
   * Refreshes data after successful registration to update UI.
   * 
   * @param {string|number} timeSlotId - ID of the time slot to register for
   */
  const handleRegister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.registerForTimeSlot(timeSlotId);
      
      // Refresh data to update UI
      const updatedSections = await Promise.all(
        seasons.map(season => candidateSectionsAPI.getCandidateSectionsBySeason(season.id))
      );
      
      setCandidateSections(updatedSections.flatMap(response => response.data));
      setStatusMessage('Successfully registered for the time slot.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register for time slot');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Handles unregistration from a time slot.
   * Refreshes data after successful unregistration to update UI.
   * 
   * @param {string|number} timeSlotId - ID of the time slot to unregister from
   */
  const handleUnregister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.unregisterFromTimeSlot(timeSlotId);
      
      // Refresh data to update UI
      const updatedSections = await Promise.all(
        seasons.map(season => candidateSectionsAPI.getCandidateSectionsBySeason(season.id))
      );
      
      setCandidateSections(updatedSections.flatMap(response => response.data));
      setStatusMessage('Successfully unregistered from the time slot.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unregister from time slot');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Checks if the current user is registered for a time slot
   * 
   * @param {Object} timeSlot - Time slot object to check
   * @returns {boolean} Whether the current user is registered for the time slot
   */
  const isRegistered = (timeSlot) => {
    return timeSlot.attendees?.some(attendee => attendee.user.id === currentUser.id);
  };

  // Show loading indicator while fetching data
  if (loading) return (
    <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
      <CircularProgress />
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Recruiting Seasons
      </Typography>
      
      <Typography variant="body1" paragraph>
        Below are the recruiting seasons that are currently available. 
        Each season has candidate sections that you can register for.
      </Typography>
      
      {/* Error and status messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {statusMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>{statusMessage}</Alert>
      )}
      
      {/* Display seasons or empty state */}
      {seasons.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No recruiting seasons available</Typography>
          <Typography variant="body2" color="textSecondary">
            Please check back later.
          </Typography>
        </Paper>
      ) : (
        seasons.map(season => {
          // Get candidate sections for this season
          const seasonSections = candidateSections.filter(
            section => section.season === season.id
          );
          
          return (
            <Paper key={season.id} sx={{ p: 3, mb: 3 }}>
              {/* Season header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  {season.title}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {season.description}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                {format(new Date(season.start_date), 'MMM d, yyyy')} - {format(new Date(season.end_date), 'MMM d, yyyy')}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Candidate sections for this season */}
              {seasonSections.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No candidate sections available for this recruiting season.
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {seasonSections.map(section => (
                    <Grid item xs={12} md={6} key={section.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          {/* Section header and basic info */}
                          <Typography variant="h6" gutterBottom>
                            {section.title}
                          </Typography>
                          
                          <Typography variant="subtitle1" gutterBottom>
                            Candidate: {section.candidate.first_name} {section.candidate.last_name}
                          </Typography>
                          
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Location: {section.location}
                          </Typography>
                          
                          {section.needs_transportation && (
                            <Chip 
                              label="Needs Transportation" 
                              color="secondary" 
                              size="small" 
                              sx={{ mb: 2 }} 
                            />
                          )}
                          
                          <Typography variant="body2" paragraph>
                            {section.description}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          {/* Time slots accordion */}
                          <Typography variant="subtitle2" gutterBottom>
                            Available Time Slots:
                          </Typography>
                          
                          {section.time_slots && section.time_slots.length > 0 ? (
                            <Accordion disableGutters>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>
                                  {section.time_slots.length} Time Slot{section.time_slots.length > 1 ? 's' : ''}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <List dense>
                                  {section.time_slots.map(slot => {
                                    const userRegistered = isRegistered(slot);
                                    const availableSpots = slot.max_attendees - (slot.attendees?.length || 0);
                                    const isFull = availableSpots <= 0;
                                    
                                    return (
                                      <ListItem key={slot.id} divider sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <ListItemText
                                          primary={
                                            <Typography variant="subtitle2">
                                              {format(new Date(slot.start_time), 'EEE, MMM d, yyyy h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                                            </Typography>
                                          }
                                          secondary={
                                            <Box sx={{ mt: 1, mb: 1 }}>
                                              <Chip 
                                                label={`${availableSpots} spot${availableSpots !== 1 ? 's' : ''} left`} 
                                                color={isFull ? "error" : "success"} 
                                                size="small" 
                                                sx={{ mr: 1 }} 
                                              />
                                              {userRegistered && (
                                                <Chip 
                                                  label="You're registered" 
                                                  color="primary" 
                                                  size="small" 
                                                />
                                              )}
                                            </Box>
                                          }
                                        />
                                        {/* Registration/Unregistration buttons */}
                                        <Box sx={{ alignSelf: 'flex-end', mt: 1 }}>
                                          {userRegistered ? (
                                            <Button 
                                              variant="outlined" 
                                              color="error" 
                                              size="small"
                                              onClick={() => handleUnregister(slot.id)}
                                            >
                                              Cancel Registration
                                            </Button>
                                          ) : (
                                            <Button 
                                              variant="contained" 
                                              size="small"
                                              disabled={isFull}
                                              onClick={() => handleRegister(slot.id)}
                                            >
                                              {isFull ? 'Fully Booked' : 'Register'}
                                            </Button>
                                          )}
                                        </Box>
                                      </ListItem>
                                    );
                                  })}
                                </List>
                              </AccordionDetails>
                            </Accordion>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No time slots available for this candidate.
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          );
        })
      )}
    </Container>
  );
};

export default RecruitingSeasons; 