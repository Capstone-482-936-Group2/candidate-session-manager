import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { sessionsAPI, timeSlotsAPI } from '../../api/api';
import { format } from 'date-fns';

const FacultyDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await sessionsAPI.getSessions();
        setSessions(response.data);
      } catch (err) {
        setError('Failed to load sessions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleRegister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.registerForTimeSlot(timeSlotId);
      // Refresh sessions data
      const response = await sessionsAPI.getSessions();
      setSessions(response.data);
    } catch (err) {
      setError('Failed to register for session');
      console.error(err);
    }
  };

  const handleUnregister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.unregisterFromTimeSlot(timeSlotId);
      // Refresh sessions data
      const response = await sessionsAPI.getSessions();
      setSessions(response.data);
    } catch (err) {
      setError('Failed to unregister from session');
      console.error(err);
    }
  };

  if (loading) return <Typography>Loading sessions...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Faculty Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {sessions.map(session => (
          <Grid item xs={12} md={6} key={session.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{session.title}</Typography>
                <Typography variant="subtitle1">
                  Candidate: {session.candidate.first_name} {session.candidate.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Location: {session.location}
                </Typography>
                <Typography variant="body2" paragraph>
                  {session.description}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Available Time Slots:
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  {session.time_slots.map(slot => (
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
                        </Box>
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        size="small"
                        disabled={slot.is_full}
                        onClick={() => handleRegister(slot.id)}
                      >
                        Register
                      </Button>
                    </Paper>
                  ))}
                  
                  {session.time_slots.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      No time slots available for this session.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {sessions.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No sessions available</Typography>
              <Typography variant="body2" color="textSecondary">
                There are no candidate sessions to display at this time.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default FacultyDashboard;