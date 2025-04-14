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
    const startTime = new Date(now);
    startTime.setHours(now.getHours() + 1, 0, 0, 0); // Next hour, 0 minutes

    // If a candidate is selected and has arrival/leaving dates, ensure the time is within those dates
    if (selectedCandidate && selectedCandidate.arrival_date && selectedCandidate.leaving_date) {
      const arrivalDate = parseISO(selectedCandidate.arrival_date);
      
      // If arrival date is in the future, set start time to morning of arrival date
      if (isAfter(arrivalDate, now)) {
        startTime.setFullYear(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate());
        startTime.setHours(9, 0, 0, 0); // 9:00 AM
      }
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60); // 1 hour slot

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
    setTimeSlots(updatedSlots);
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

    // Validate time slots
    let isValid = true;
    let errorMessage = '';

    timeSlots.forEach((slot, index) => {
      if (!slot.start_time || !slot.end_time) {
        isValid = false;
        errorMessage = 'All time slots must have start and end times';
      }

      if (isValid && isBefore(slot.end_time, slot.start_time)) {
        isValid = false;
        errorMessage = `Time slot ${index + 1} has end time before start time`;
      }

      // Check if time is within candidate's visiting dates
      if (isValid && selectedCandidate.arrival_date && selectedCandidate.leaving_date) {
        const arrivalDate = new Date(selectedCandidate.arrival_date);
        arrivalDate.setHours(0, 0, 0, 0); // Start of arrival day
        
        const leavingDate = new Date(selectedCandidate.leaving_date);
        leavingDate.setHours(23, 59, 59, 999); // End of leaving day
        
        if (isBefore(slot.start_time, arrivalDate) || isAfter(slot.start_time, leavingDate)) {
          isValid = false;
          errorMessage = `Time slot ${index + 1} is outside the candidate's visit dates (${format(arrivalDate, 'MMM d, yyyy')} - ${format(leavingDate, 'MMM d, yyyy')})`;
        }
      }
    });

    if (!isValid) {
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return;
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
                <Card>
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
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        {section.candidate.first_name} {section.candidate.last_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {section.candidate.email}
                      </Typography>
                      
                      {section.arrival_date && section.leaving_date && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={`Visit: ${format(parseISO(section.arrival_date), 'MMM d')} - ${format(parseISO(section.leaving_date), 'MMM d, yyyy')}`}
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        </Box>
                      )}
                      
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
          
          {selectedCandidate.arrival_date && selectedCandidate.leaving_date && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This candidate will be visiting from {format(parseISO(selectedCandidate.arrival_date), 'MMMM d')} to {format(parseISO(selectedCandidate.leaving_date), 'MMMM d, yyyy')}. Please select times within this range.
            </Alert>
          )}
          
          {existingSubmissions.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your Existing Availability Submissions
              </Typography>
              
              {existingSubmissions.map(submission => (
                <Paper key={submission.id} sx={{ p: 2, mb: 2 }}>
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
          
          <Paper sx={{ p: 3, mb: 4 }}>
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
                  />
                  <DateTimePicker
                    label="End Time"
                    value={slot.end_time}
                    onChange={(newValue) => handleTimeSlotChange(index, 'end_time', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
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
