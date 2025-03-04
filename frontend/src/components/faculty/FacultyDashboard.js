import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Box, Grid, Card, CardContent, 
  Button, Chip, Accordion, AccordionSummary, AccordionDetails, 
  Divider, Alert, CircularProgress, List, ListItem, ListItemText
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { seasonsAPI, timeSlotsAPI, candidateSectionsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const FacultyDashboard = () => {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [candidateSections, setCandidateSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setLoading(true);
        const seasonsResponse = await seasonsAPI.getSeasons();
        setSeasons(seasonsResponse.data);
      } catch (err) {
        console.error('Error fetching seasons:', err);
        setError('Failed to load recruiting seasons');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, []);

  const fetchCandidateSections = async (seasonId) => {
    try {
      setLoading(true);
      const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(sectionsResponse.data);
      setSelectedSeason(seasons.find(season => season.id === seasonId));
    } catch (err) {
      console.error('Error fetching candidate sections:', err);
      setError('Failed to load candidate sections');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.registerForTimeSlot(timeSlotId);
      
      // Refresh candidate sections for the current season
      if (selectedSeason) {
        const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(selectedSeason.id);
        setCandidateSections(sectionsResponse.data);
      }
      
      setStatusMessage({
        text: 'Successfully registered for the time slot',
        severity: 'success'
      });
    } catch (err) {
      setStatusMessage({
        text: 'Failed to register for time slot',
        severity: 'error'
      });
      console.error(err);
    }
  };

  const handleUnregister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.unregisterFromTimeSlot(timeSlotId);
      
      // Refresh candidate sections for the current season
      if (selectedSeason) {
        const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(selectedSeason.id);
        setCandidateSections(sectionsResponse.data);
      }
      
      setStatusMessage({
        text: 'Successfully unregistered from the time slot',
        severity: 'success'
      });
    } catch (err) {
      setStatusMessage({
        text: 'Failed to unregister from time slot',
        severity: 'error'
      });
      console.error(err);
    }
  };

  const isRegistered = (timeSlot) => {
    return timeSlot.attendees?.some(attendee => attendee?.user?.id === currentUser?.id) || false;
  };

  if (loading && !selectedSeason) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Faculty Dashboard
      </Typography>

      {statusMessage && (
        <Alert 
          severity={statusMessage.severity} 
          sx={{ mb: 3 }} 
          onClose={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!selectedSeason ? (
        <>
          <Typography variant="body1" paragraph>
            Select a recruiting season to view available candidate sections.
          </Typography>

          <Grid container spacing={3}>
            {seasons.map(season => (
              <Grid item xs={12} md={6} key={season.id}>
                <Card>
                  <CardContent>
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
                      {format(parseISO(season.start_date), 'MMM d, yyyy')} - {format(parseISO(season.end_date), 'MMM d, yyyy')}
                    </Typography>
                  </CardContent>
                  <Button 
                    fullWidth 
                    onClick={() => fetchCandidateSections(season.id)}
                    sx={{ mt: 1 }}
                  >
                    View Candidate Sections
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Button onClick={() => setSelectedSeason(null)}>
              Back to Seasons
            </Button>
            <Typography variant="h5" sx={{ mt: 2 }}>
              {selectedSeason.title}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              {format(parseISO(selectedSeason.start_date), 'MMM d, yyyy')} - {format(parseISO(selectedSeason.end_date), 'MMM d, yyyy')}
            </Typography>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : candidateSections.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No Candidate Sections Available</Typography>
              <Typography variant="body2" color="textSecondary">
                There are no candidate sections available for registration at this time.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {candidateSections.map(section => (
                <Grid item xs={12} md={6} key={section.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {section.candidate.first_name} {section.candidate.last_name}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        {section.candidate.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {section.needs_transportation && (
                          <Chip 
                            label="Needs Transportation" 
                            color="secondary" 
                            size="small"
                          />
                        )}
                        {section.arrival_date && (
                          <Chip 
                            label={`Arrives: ${format(parseISO(section.arrival_date), 'MMM d, yyyy')}`}
                            size="small"
                            color="info"
                          />
                        )}
                        {section.leaving_date && (
                          <Chip 
                            label={`Leaves: ${format(parseISO(section.leaving_date), 'MMM d, yyyy')}`}
                            size="small"
                            color="info"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" paragraph>
                        {section.description}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2">
                        Time Slots:
                      </Typography>

                      {section.time_slots && section.time_slots.length > 0 ? (
                        <List dense>
                          {section.time_slots.map(slot => (
                            <ListItem 
                              key={slot.id}
                              sx={{ 
                                backgroundColor: slot.attendees?.length >= slot.max_attendees ? '#f5f5f5' : 'white',
                                borderRadius: 1,
                                mb: 1,
                                border: '1px solid',
                                borderColor: isRegistered(slot) ? 'primary.main' : 'divider'
                              }}
                            >
                              <ListItemText
                                primary={`${format(new Date(slot.start_time), 'MMM d, yyyy h:mm a')} - ${format(new Date(slot.end_time), 'h:mm a')}`}
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    {slot.location && (
                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Location: {slot.location}
                                      </Typography>
                                    )}
                                    {slot.description && (
                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        {slot.description}
                                      </Typography>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                      <Chip 
                                        label={`${slot.attendees?.length || 0}/${slot.max_attendees} registered`}
                                        size="small"
                                        color={slot.attendees?.length >= slot.max_attendees ? "error" : "success"}
                                      />
                                      {isRegistered(slot) && (
                                        <Chip 
                                          label="You are registered"
                                          size="small"
                                          color="primary"
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                }
                              />
                              {isRegistered(slot) ? (
                                <Button 
                                  variant="outlined"
                                  color="error" 
                                  onClick={() => handleUnregister(slot.id)}
                                  disabled={loading}
                                  size="small"
                                >
                                  Unregister
                                </Button>
                              ) : (
                                <Button 
                                  variant="contained"
                                  color="primary" 
                                  onClick={() => handleRegister(slot.id)}
                                  disabled={loading || (slot.attendees?.length >= slot.max_attendees)}
                                  size="small"
                                >
                                  Register
                                </Button>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No time slots available.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default FacultyDashboard;