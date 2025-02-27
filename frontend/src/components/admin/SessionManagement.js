import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Grid, Button, TextField, FormControl, InputLabel, 
  Select, MenuItem, Box, List, ListItem, ListItemText, IconButton,
  Card, CardContent, CardActions, Divider, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Snackbar, Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { usersAPI, sessionsAPI, timeSlotsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const SessionManagement = () => {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form states
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    location: '',
    candidate: ''
  });

  const [timeSlots, setTimeSlots] = useState([{
    start_time: new Date(),
    end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
    max_attendees: 1
  }]);

  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersResponse, sessionsResponse] = await Promise.all([
          usersAPI.getUsers(),
          sessionsAPI.getSessions()
        ]);
        
        setUsers(usersResponse.data);
        setSessions(sessionsResponse.data);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = () => {
    setSessionForm({
      title: '',
      description: '',
      location: '',
      candidate: ''
    });
    setTimeSlots([{
      start_time: new Date(),
      end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
      max_attendees: 1
    }]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenTimeSlotDialog = (session) => {
    setSelectedSession(session);
    setTimeSlots([{
      start_time: new Date(),
      end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
      max_attendees: 1
    }]);
    setTimeSlotDialogOpen(true);
  };

  const handleCloseTimeSlotDialog = () => {
    setTimeSlotDialogOpen(false);
    setSelectedSession(null);
  };

  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;
    setSessionForm({
      ...sessionForm,
      [name]: value
    });
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index] = {
      ...updatedTimeSlots[index],
      [field]: value
    };
    setTimeSlots(updatedTimeSlots);
  };

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const newStartTime = new Date(lastSlot.end_time);
    const newEndTime = new Date(newStartTime);
    newEndTime.setHours(newEndTime.getHours() + 1);
    
    setTimeSlots([
      ...timeSlots,
      {
        start_time: newStartTime,
        end_time: newEndTime,
        max_attendees: 1
      }
    ]);
  };

  const removeTimeSlot = (index) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const handleCreateSession = async () => {
    try {
      // Step 1: Create the session
      const sessionResponse = await sessionsAPI.createSession({
        ...sessionForm,
        created_by: currentUser.id // Make sure this is set to the logged-in admin
      });
      
      // Step 2: Create time slots for the session
      const sessionId = sessionResponse.data.id;
      
      await Promise.all(timeSlots.map(slot => 
        timeSlotsAPI.createTimeSlot({
          session: sessionId,
          start_time: slot.start_time.toISOString(),
          end_time: slot.end_time.toISOString(),
          max_attendees: slot.max_attendees
        })
      ));
      
      // Refresh sessions data
      const refreshedSessions = await sessionsAPI.getSessions();
      setSessions(refreshedSessions.data);
      
      setSnackbar({
        open: true,
        message: 'Session created successfully!',
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to create session',
        severity: 'error'
      });
    }
  };

  const handleAddTimeSlots = async () => {
    if (!selectedSession) return;
    
    try {
      // Create time slots for the session
      await Promise.all(timeSlots.map(slot => 
        timeSlotsAPI.createTimeSlot({
          session: selectedSession.id,
          start_time: slot.start_time.toISOString(),
          end_time: slot.end_time.toISOString(),
          max_attendees: slot.max_attendees
        })
      ));
      
      // Refresh sessions data
      const refreshedSessions = await sessionsAPI.getSessions();
      setSessions(refreshedSessions.data);
      
      setSnackbar({
        open: true,
        message: 'Time slots added successfully!',
        severity: 'success'
      });
      
      handleCloseTimeSlotDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to add time slots',
        severity: 'error'
      });
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }
    
    try {
      await sessionsAPI.deleteSession(sessionId);
      
      // Refresh sessions data
      setSessions(sessions.filter(session => session.id !== sessionId));
      
      setSnackbar({
        open: true,
        message: 'Session deleted successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to delete session',
        severity: 'error'
      });
    }
  };

  const handleDeleteTimeSlot = async (timeSlotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot? This will remove all attendee registrations.')) {
      return;
    }
    
    try {
      await timeSlotsAPI.deleteTimeSlot(timeSlotId);
      
      // Update sessions state to reflect the deleted time slot
      setSessions(sessions.map(session => ({
        ...session,
        time_slots: session.time_slots.filter(slot => slot.id !== timeSlotId)
      })));
      
      setSnackbar({
        open: true,
        message: 'Time slot deleted successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to delete time slot',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter users to show only candidates for the dropdown
  const candidates = users.filter(user => user.user_type === 'candidate');

  if (loading) return <Typography>Loading sessions...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Session Management
          </Typography>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Create Session
          </Button>
        </Box>
        
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
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2">
                    Time Slots:
                  </Typography>
                  
                  {session.time_slots && session.time_slots.length > 0 ? (
                    <List dense>
                      {session.time_slots.map(slot => (
                        <ListItem
                          key={slot.id}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleDeleteTimeSlot(slot.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={`${format(new Date(slot.start_time), 'MMM d, yyyy h:mm a')} to ${format(new Date(slot.end_time), 'h:mm a')}`}
                            secondary={
                              <Chip 
                                label={`${slot.available_slots}/${slot.max_attendees} slots available`} 
                                size="small" 
                                color={slot.available_slots > 0 ? "success" : "error"}
                              />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No time slots available for this session.
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleOpenTimeSlotDialog(session)}>
                    Add Time Slots
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    Delete Session
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {sessions.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">No sessions available</Typography>
                <Typography variant="body2" color="textSecondary">
                  Create a new session to get started.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Create Session Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Session Title"
                  fullWidth
                  value={sessionForm.title}
                  onChange={handleSessionFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={sessionForm.description}
                  onChange={handleSessionFormChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="location"
                  label="Location"
                  fullWidth
                  value={sessionForm.location}
                  onChange={handleSessionFormChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="candidate-select-label">Candidate</InputLabel>
                  <Select
                    labelId="candidate-select-label"
                    name="candidate"
                    value={sessionForm.candidate}
                    label="Candidate"
                    onChange={handleSessionFormChange}
                  >
                    {candidates.map(candidate => (
                      <MenuItem key={candidate.id} value={candidate.id}>
                        {candidate.first_name} {candidate.last_name} ({candidate.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Time Slots
                </Typography>
                
                {timeSlots.map((slot, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <DateTimePicker
                      label="Start Time"
                      value={slot.start_time}
                      onChange={(newValue) => handleTimeSlotChange(index, 'start_time', newValue)}
                      sx={{ flex: 1 }}
                    />
                    <DateTimePicker
                      label="End Time"
                      value={slot.end_time}
                      onChange={(newValue) => handleTimeSlotChange(index, 'end_time', newValue)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Max Attendees"
                      type="number"
                      InputProps={{ inputProps: { min: 1 } }}
                      value={slot.max_attendees}
                      onChange={(e) => handleTimeSlotChange(index, 'max_attendees', parseInt(e.target.value))}
                      sx={{ width: '120px' }}
                    />
                    <IconButton 
                      color="error" 
                      onClick={() => removeTimeSlot(index)}
                      disabled={timeSlots.length <= 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={addTimeSlot}
                  sx={{ mt: 1 }}
                >
                  Add Another Time Slot
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleCreateSession} variant="contained">
              Create Session
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Time Slots Dialog */}
        <Dialog open={timeSlotDialogOpen} onClose={handleCloseTimeSlotDialog} maxWidth="md" fullWidth>
          <DialogTitle>Add Time Slots to Session</DialogTitle>
          <DialogContent>
            <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
              {selectedSession?.title}
            </Typography>
            
            {timeSlots.map((slot, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <DateTimePicker
                  label="Start Time"
                  value={slot.start_time}
                  onChange={(newValue) => handleTimeSlotChange(index, 'start_time', newValue)}
                  sx={{ flex: 1 }}
                />
                <DateTimePicker
                  label="End Time"
                  value={slot.end_time}
                  onChange={(newValue) => handleTimeSlotChange(index, 'end_time', newValue)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Max Attendees"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={slot.max_attendees}
                  onChange={(e) => handleTimeSlotChange(index, 'max_attendees', parseInt(e.target.value))}
                  sx={{ width: '120px' }}
                />
                <IconButton 
                  color="error" 
                  onClick={() => removeTimeSlot(index)}
                  disabled={timeSlots.length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Button 
              startIcon={<AddIcon />} 
              onClick={addTimeSlot}
              sx={{ mt: 1 }}
            >
              Add Another Time Slot
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTimeSlotDialog}>Cancel</Button>
            <Button onClick={handleAddTimeSlots} variant="contained">
              Add Time Slots
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </LocalizationProvider>
  );
};

export default SessionManagement;