import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Box, Button, TextField, 
  Grid, Snackbar, Alert, CircularProgress, Chip, IconButton,
  Card, CardContent, CardActions, Divider, List, ListItem,
  ListItemText, DialogActions, DialogContent, DialogTitle, Dialog
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { seasonsAPI, candidateSectionsAPI, facultyAvailabilityAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Flight as FlightIcon } from '@mui/icons-material';

const CandidateDateInfo = ({ candidateSection }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      mb: 3, 
      p: 2, 
      bgcolor: alpha(theme.palette.info.main, 0.1), 
      borderRadius: 2,
      border: '1px solid',
      borderColor: alpha(theme.palette.info.main, 0.2),
    }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Candidate Visit Information
      </Typography>
      
      {(!candidateSection?.arrival_date && !candidateSection?.leaving_date) ? (
        <Typography color="text.secondary">
          No visit dates specified for this candidate. Please coordinate with the admin for scheduling information.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {candidateSection.arrival_date ? (
              <Chip
                icon={<FlightIcon fontSize="small" />}
                label={`Arrives: ${format(parseISO(candidateSection.arrival_date), 'MMM d, yyyy')}`}
                color="info"
                size="small"
                sx={{ borderRadius: 1.5 }}
              />
            ) : (
              <Chip
                label="No arrival date specified"
                color="default"
                size="small"
                sx={{ borderRadius: 1.5 }}
              />
            )}
            
            {candidateSection.leaving_date ? (
              <Chip
                icon={<FlightIcon fontSize="small" />}
                label={`Departs: ${format(parseISO(candidateSection.leaving_date), 'MMM d, yyyy')}`}
                color="info"
                size="small"
                sx={{ borderRadius: 1.5 }}
              />
            ) : (
              <Chip
                label="No departure date specified"
                color="default"
                size="small"
                sx={{ borderRadius: 1.5 }}
              />
            )}
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {candidateSection.arrival_date && candidateSection.leaving_date ? 
              "Please schedule your availability within the candidate's visit dates." :
              "Some visit dates are missing. Please coordinate with the admin for scheduling information."}
          </Typography>
        </>
      )}
      
      {(candidateSection?.arrival_date || candidateSection?.leaving_date) && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Days:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {candidateSection.arrival_date && candidateSection.leaving_date && 
              getDatesInRange(parseISO(candidateSection.arrival_date), parseISO(candidateSection.leaving_date))
                .map(date => (
                  <Chip 
                    key={date.toISOString()}
                    label={format(date, 'd MMM')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ minWidth: '70px' }}
                  />
                ))
            }
          </Box>
        </Box>
      )}
    </Box>
  );
};

const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  currentDate.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(endDate);
  lastDate.setHours(23, 59, 59, 999);
  
  while (currentDate <= lastDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

const FacultyAvailabilityForm = () => {
  const { currentUser } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [candidateSections, setCandidateSections] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [existingSubmissions, setExistingSubmissions] = useState([]);
  
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setLoading(true);
        const response = await seasonsAPI.getSeasons();
        // Only include current and future seasons
        const currentDate = new Date();
        const activeSeasons = response.data.filter(season => 
          parseISO(season.end_date) >= currentDate
        );
        setSeasons(activeSeasons);
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
      const response = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(response.data);
      setSelectedSeason(seasons.find(season => season.id === seasonId));
      setSelectedCandidate(null);
    } catch (err) {
      console.error('Error fetching candidate sections:', err);
      setError('Failed to load candidate sections');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingSubmissions = async (candidateSectionId) => {
    try {
      setLoading(true);
      const response = await facultyAvailabilityAPI.getAvailabilityByCandidate(candidateSectionId);
      // Filter to only show this faculty member's submissions
      const facultySubmissions = response.data.filter(
        submission => submission.faculty === currentUser.id
      );
      setExistingSubmissions(facultySubmissions);
    } catch (err) {
      console.error('Error fetching existing submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidateSection) => {
    setSelectedCandidate(candidateSection);
    setTimeSlots([]);
    setNotes('');
    fetchExistingSubmissions(candidateSection.id);
  };

  const handleAddTimeSlot = () => {
    // Get default start time (today at the next hour)
    const now = new Date();
    let startTime = new Date(now);
    startTime.setHours(now.getHours() + 1, 0, 0, 0); // Next hour, 0 minutes

    // If a candidate is selected and has arrival/leaving dates, ensure the time is within those dates
    if (selectedCandidate) {
      const arrivalDate = selectedCandidate.arrival_date ? parseISO(selectedCandidate.arrival_date) : null;
      const leavingDate = selectedCandidate.leaving_date ? parseISO(selectedCandidate.leaving_date) : null;
      
      // Set to arrival date if it's in the future
      if (arrivalDate && isAfter(arrivalDate, now)) {
        startTime = new Date(arrivalDate);
        startTime.setHours(9, 0, 0, 0); // 9:00 AM
      }
      
      // Make sure startTime is not after leaving date
      if (leavingDate && isAfter(startTime, leavingDate)) {
        startTime = new Date(leavingDate);
        startTime.setHours(9, 0, 0, 0); // 9:00 AM
      }
    }

    // Create end time one hour after start
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60); // 1 hour slot
    
    // Adjust end time if it exceeds leaving date
    if (selectedCandidate?.leaving_date) {
      const leavingDate = parseISO(selectedCandidate.leaving_date);
      leavingDate.setHours(23, 59, 59); // End of day
      
      if (isAfter(endTime, leavingDate)) {
        endTime.setTime(leavingDate.getTime());
      }
    }

    setTimeSlots([...timeSlots, { start_time: startTime, end_time: endTime }]);
  };

  const handleRemoveTimeSlot = (index) => {
    const updatedSlots = [...timeSlots];
    updatedSlots.splice(index, 1);
    setTimeSlots(updatedSlots);
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    
    // Validate the time slot immediately
    const errors = validateTimeSlot(
      field === 'start_time' ? value : updatedSlots[index].start_time,
      field === 'end_time' ? value : updatedSlots[index].end_time
    );
    
    if (errors.length > 0) {
      setSnackbar({
        open: true,
        message: errors.join('. '),
        severity: 'warning'
      });
    }
    
    setTimeSlots(updatedSlots);
  };

  const validateTimeSlot = (startTime, endTime) => {
    const errors = [];
    
    // Check if candidate has arrival/departure dates
    if (selectedCandidate?.arrival_date || selectedCandidate?.leaving_date) {
      const arrivalDate = selectedCandidate.arrival_date ? new Date(selectedCandidate.arrival_date) : null;
      const leavingDate = selectedCandidate.leaving_date ? new Date(selectedCandidate.leaving_date) : null;
      
      // Set arrival date to start of day and leaving date to end of day
      if (arrivalDate) {
        arrivalDate.setHours(0, 0, 0, 0);
      }
      if (leavingDate) {
        leavingDate.setHours(23, 59, 59, 999);
      }
      
      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : null;
      
      // Check if start time is before arrival date
      if (arrivalDate && start < arrivalDate) {
        errors.push("Start time cannot be before candidate's arrival date");
      }
      
      // Check if end time is after leaving date
      if (leavingDate && end && end > leavingDate) {
        errors.push("End time cannot be after candidate's departure date");
      }
      
      // If no end time, check if start time is after leaving date
      if (leavingDate && !end && start > leavingDate) {
        errors.push("Time slot cannot start after candidate's departure date");
      }
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    if (!selectedCandidate) {
      setSnackbar({
        open: true,
        message: 'Please select a candidate',
        severity: 'error'
      });
      return;
    }

    if (timeSlots.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please add at least one time slot',
        severity: 'error'
      });
      return;
    }

    // Validate all time slots
    let hasErrors = false;
    for (const slot of timeSlots) {
      const errors = validateTimeSlot(slot.start_time, slot.end_time);
      if (errors.length > 0) {
        setSnackbar({
          open: true,
          message: errors.join('. '),
          severity: 'error'
        });
        hasErrors = true;
        break;
      }
    }
    
    if (hasErrors) {
      return; // Don't submit if there are validation errors
    }

    try {
      setLoading(true);
      
      // Format time slots for API
      const formattedTimeSlots = timeSlots.map(slot => ({
        start_time: slot.start_time.toISOString(),
        end_time: slot.end_time.toISOString()
      }));
      
      const availabilityData = {
        candidate_section: selectedCandidate.id,
        notes: notes,
        time_slots: formattedTimeSlots
      };
      
      await facultyAvailabilityAPI.submitAvailability(availabilityData);
      
      setSnackbar({
        open: true,
        message: 'Availability submitted successfully',
        severity: 'success'
      });
      
      // Reset form
      setTimeSlots([]);
      setNotes('');
      
      // Refresh existing submissions
      fetchExistingSubmissions(selectedCandidate.id);
      
    } catch (err) {
      console.error('Error submitting availability:', err);
      setSnackbar({
        open: true,
        message: 'Failed to submit availability: ' + (err.response?.data?.detail || err.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (id) => {
    try {
      setLoading(true);
      await facultyAvailabilityAPI.deleteAvailability(id);
      
      setSnackbar({
        open: true,
        message: 'Availability submission deleted successfully',
        severity: 'success'
      });
      
      // Refresh existing submissions
      fetchExistingSubmissions(selectedCandidate.id);
    } catch (err) {
      console.error('Error deleting submission:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete submission',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && !selectedSeason && !selectedCandidate) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Faculty Availability Form
      </Typography>
      
      <Typography variant="body1" paragraph>
        Use this form to specify when you're available to meet with candidates.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {!selectedSeason ? (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select a Recruiting Season
          </Typography>
          
          <Grid container spacing={3}>
            {seasons.map(season => (
              <Grid item xs={12} md={6} key={season.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">
                      {season.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {season.start_date ? format(parseISO(season.start_date), 'MMM d, yyyy') : 'No start date'} - {season.end_date ? format(parseISO(season.end_date), 'MMM d, yyyy') : 'No end date'}
                    </Typography>
                    <Typography variant="body2">
                      {season.description || 'No description available'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => fetchCandidateSections(season.id)}
                    >
                      Select
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : !selectedCandidate ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => setSelectedSeason(null)} sx={{ mr: 2 }}>
              Back to Seasons
            </Button>
            <Typography variant="h6">
              {selectedSeason.title}
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select a Candidate
          </Typography>
          
          {candidateSections.length === 0 ? (
            <Alert severity="info">
              No candidates found for this season.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {candidateSections.map(section => (
                <Grid item xs={12} md={6} key={section.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">
                        {section.candidate.first_name} {section.candidate.last_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {section.candidate.email}
                      </Typography>
                      
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="primary.main" gutterBottom>
                          Candidate Visit Dates:
                        </Typography>
                        
                        {section.arrival_date ? (
                          <Chip 
                            icon={<FlightIcon fontSize="small" />}
                            label={`Arrives: ${format(parseISO(section.arrival_date), 'MMM d, yyyy')}`} 
                            color="info"
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ) : (
                          <Chip
                            label="No arrival date specified"
                            color="default"
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        )}
                        
                        {section.leaving_date ? (
                          <Chip 
                            icon={<FlightIcon fontSize="small" />}
                            label={`Departs: ${format(parseISO(section.leaving_date), 'MMM d, yyyy')}`}
                            color="info" 
                            size="small"
                            sx={{ mb: 1 }}
                          />
                        ) : (
                          <Chip
                            label="No departure date specified"
                            color="default"
                            size="small"
                            sx={{ mb: 1 }}
                          />
                        )}
                      </Box>
                      
                      {section.description && (
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          {section.description}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handleSelectCandidate(section)}
                      >
                        Select
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        <>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => setSelectedCandidate(null)} sx={{ mr: 2 }}>
              Back to Candidates
            </Button>
            <Typography variant="h6">
              {selectedCandidate.candidate.first_name} {selectedCandidate.candidate.last_name}
            </Typography>
          </Box>
          
          <CandidateDateInfo candidateSection={selectedCandidate} />
          
          {existingSubmissions.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your Existing Availability Submissions
              </Typography>
              
              {existingSubmissions.map(submission => (
                <Paper key={submission.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Submitted on {format(parseISO(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="error"
                      size="small"
                      onClick={() => handleDeleteSubmission(submission.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                  
                  {submission.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Notes:</Typography>
                      <Typography variant="body2">{submission.notes}</Typography>
                    </Box>
                  )}
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Time Slots:
                  </Typography>
                  
                  <List dense>
                    {submission.time_slots.map((slot, index) => (
                      <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                        <ListItemText
                          primary={`${format(parseISO(slot.start_time), 'MMM d, yyyy h:mm a')} - ${format(parseISO(slot.end_time), 'h:mm a')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ))}
              
              <Divider sx={{ my: 3 }} />
            </Box>
          )}
          
          <Typography variant="h6" gutterBottom>
            Add New Availability
          </Typography>
          
          {selectedCandidate?.arrival_date && selectedCandidate?.leaving_date && (
            <Typography 
              variant="subtitle1" 
              color="primary" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold', 
                backgroundColor: '#e3f2fd', 
                p: 1, 
                borderRadius: 1 
              }}
            >
              Candidate Visit Dates: {format(parseISO(selectedCandidate.arrival_date), 'MMMM d, yyyy')} to {format(parseISO(selectedCandidate.leaving_date), 'MMMM d, yyyy')}
            </Typography>
          )}
          
          <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Time Slots
            </Typography>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {timeSlots.map((slot, index) => (
                <Box key={index} sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <DateTimePicker
                    label="Start Time"
                    value={slot.start_time}
                    onChange={(newValue) => handleTimeSlotChange(index, 'start_time', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDateTime={selectedCandidate.arrival_date ? parseISO(selectedCandidate.arrival_date) : undefined}
                    maxDateTime={selectedCandidate.leaving_date ? (() => {
                      const date = parseISO(selectedCandidate.leaving_date);
                      date.setHours(23, 59, 59);
                      return date;
                    })() : undefined}
                  />
                  <DateTimePicker
                    label="End Time"
                    value={slot.end_time}
                    onChange={(newValue) => handleTimeSlotChange(index, 'end_time', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDateTime={slot.start_time}
                    maxDateTime={selectedCandidate.leaving_date ? (() => {
                      const date = parseISO(selectedCandidate.leaving_date);
                      date.setHours(23, 59, 59);
                      return date;
                    })() : undefined}
                  />
                  <IconButton 
                    color="error" 
                    onClick={() => handleRemoveTimeSlot(index)}
                    sx={{ mt: { xs: 1, md: 0 } }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </LocalizationProvider>
            
            <Button 
              startIcon={<AddIcon />} 
              variant="outlined" 
              onClick={handleAddTimeSlot}
              sx={{ mb: 3 }}
            >
              Add Time Slot
            </Button>
            
            <TextField
              label="Notes (optional)"
              fullWidth
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about your availability"
              sx={{ mb: 3 }}
            />
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit}
              disabled={loading || timeSlots.length === 0}
              sx={{ mr: 2 }}
            >
              Submit Availability
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => setSelectedCandidate(null)}
            >
              Cancel
            </Button>
          </Paper>
        </>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FacultyAvailabilityForm;
