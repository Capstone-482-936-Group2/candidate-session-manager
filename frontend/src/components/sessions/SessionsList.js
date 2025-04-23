/**
 * Component to display and manage candidate sessions.
 * Shows different views based on user role (admin/faculty vs candidate).
 * Allows faculty/admin to register for sessions and candidates to create new sessions.
 */
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Box, Grid, Card, 
  CardContent, Button, Chip, Alert 
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { sessionsAPI, timeSlotsAPI } from '../../api/api';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import AddSessionDialog from './AddSessionDialog';

/**
 * SessionsList component displays available sessions with time slots.
 * - For admin/faculty: Shows all sessions with registration options
 * - For candidates: Shows only their sessions with option to create new ones
 * 
 * @returns {React.ReactNode} List of sessions with appropriate controls
 */
const SessionsList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { currentUser, isAdmin, isFaculty } = useAuth();

  /**
   * Fetch sessions on component mount or when user ID changes
   */
  useEffect(() => {
    fetchSessions();
  }, [currentUser.id]);

  /**
   * Fetches sessions from API and filters based on user role
   * - Admin/faculty see all sessions
   * - Candidates see only their own sessions
   */
  const fetchSessions = async () => {
    try {
      const response = await sessionsAPI.getSessions();
      // Filter sessions based on user role
      const filteredSessions = isAdmin || isFaculty
        ? response.data // Show all sessions for admin/faculty
        : response.data.filter(session => session.candidate.id === currentUser.id); // Show only user's sessions for candidates
      setSessions(filteredSessions);
    } catch (err) {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles registration for a specific time slot
   * 
   * @param {string|number} timeSlotId - ID of the time slot to register for
   */
  const handleRegister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.registerForTimeSlot(timeSlotId);
      fetchSessions();
    } catch (err) {
      setError('Failed to register for session');
    }
  };

  /**
   * Handles unregistration from a specific time slot
   * 
   * @param {string|number} timeSlotId - ID of the time slot to unregister from
   */
  const handleUnregister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.unregisterFromTimeSlot(timeSlotId);
      fetchSessions();
    } catch (err) {
      setError('Failed to unregister from session');
    }
  };

  /**
   * Creates a new session and an associated time slot
   * 
   * @param {Object} sessionData - Data for the new session
   * @param {string} sessionData.title - Session title
   * @param {string} sessionData.description - Session description
   * @param {string} sessionData.location - Session location
   * @param {boolean} sessionData.needs_transportation - Whether transportation is needed
   * @param {Date} sessionData.start_time - Start time for the time slot
   * @param {Date} sessionData.end_time - End time for the time slot
   */
  const handleCreateSession = async (sessionData) => {
    try {
      // Create the session
      const sessionResponse = await sessionsAPI.createSession({
        title: sessionData.title,
        description: sessionData.description,
        location: sessionData.location,
        needs_transportation: sessionData.needs_transportation
      });

      // Create the time slot
      await timeSlotsAPI.createTimeSlot({
        session: sessionResponse.data.id,
        start_time: sessionData.start_time.toISOString(),
        end_time: sessionData.end_time.toISOString(),
        max_attendees: 3 // Default to 3 faculty members
      });

      fetchSessions();
    } catch (err) {
      setError('Failed to create session');
    }
  };

  if (loading) return <Typography>Loading sessions...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header with title and action button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isAdmin || isFaculty ? 'All Candidate Sessions' : 'My Sessions'}
        </Typography>
        
        {/* Show "Schedule Session" button only for candidates */}
        {!isAdmin && !isFaculty && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Schedule Session
          </Button>
        )}
      </Box>

      {/* Error message display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Grid of session cards */}
      <Grid container spacing={3}>
        {sessions.map(session => (
          <Grid item xs={12} md={6} key={session.id}>
            <Card>
              <CardContent>
                {/* Session details */}
                <Typography variant="h6">{session.title}</Typography>
                <Typography variant="subtitle1">
                  Candidate: {session.candidate.first_name} {session.candidate.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Location: {session.location}
                </Typography>
                {session.needs_transportation && (
                  <Chip 
                    label="Transportation Needed" 
                    color="secondary" 
                    size="small" 
                    sx={{ mb: 1 }}
                  />
                )}
                <Typography variant="body2" paragraph>
                  {session.description}
                </Typography>
                
                {/* Time slots section */}
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Time Slots:
                </Typography>
                
                {session.time_slots
                  .filter(slot => Boolean(slot.is_visible))
                  .map(slot => (
                    <Paper 
                      key={slot.id} 
                      sx={{ 
                        p: 2, 
                        mb: 1, 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: slot.is_full ? '#f5f5f5' : 'white'
                      }}
                    >
                      <Box>
                        <Typography variant="body2">
                          {format(new Date(slot.start_time), 'MMM d, yyyy h:mm a')} to {format(new Date(slot.end_time), 'h:mm a')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            label={`${slot.available_slots} slots available`} 
                            size="small" 
                            color={slot.available_slots > 0 ? "success" : "error"}
                          />
                          {slot.attendees?.some(attendee => attendee.user.id === currentUser.id) && (
                            <Chip 
                              label="You're registered" 
                              size="small" 
                              color="primary"
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Registration/unregistration buttons for faculty/admin */}
                      {(isAdmin || isFaculty) && (
                        slot.attendees?.some(attendee => attendee.user.id === currentUser.id) ? (
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            onClick={() => handleUnregister(slot.id)}
                          >
                            Unregister
                          </Button>
                        ) : (
                          <Button 
                            variant="contained" 
                            size="small"
                            disabled={slot.is_full}
                            onClick={() => handleRegister(slot.id)}
                          >
                            Register
                          </Button>
                        )
                      )}
                    </Paper>
                  ))}
                
                {session.time_slots.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No time slots available for this session.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {/* Empty state message */}
        {sessions.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No sessions available</Typography>
              <Typography variant="body2" color="textSecondary">
                {isAdmin || isFaculty 
                  ? 'There are no candidate sessions to display at this time.'
                  : 'You haven\'t scheduled any sessions yet. Click the "Schedule Session" button to create one.'}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Session creation dialog */}
      <AddSessionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateSession}
      />
    </Container>
  );
};

export default SessionsList; 