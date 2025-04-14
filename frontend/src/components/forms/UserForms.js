import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  Edit as EditIcon, 
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FormSubmission from './FormSubmission';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { 
  seasonsAPI, 
  candidateSectionsAPI, 
  facultyAvailabilityAPI
} from '../../api/api';
import { availabilityInvitationAPI } from '../../api/api';

const UserForms = () => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [selectedForm, setSelectedForm] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const navigate = useNavigate();
  
  // Faculty Availability states
  const [showFacultySection, setShowFacultySection] = useState(false);
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
  const [candidateSections, setCandidateSections] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [existingSubmissions, setExistingSubmissions] = useState([]);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(null);

  useEffect(() => {
    fetchForms();
    
    // Check if user is faculty, admin or superadmin
    if (currentUser && ['faculty', 'admin', 'superadmin'].includes(currentUser.user_type)) {
      setShowFacultySection(true);
      fetchCandidates();
    }
  }, [currentUser]);

  const fetchForms = async () => {
    try {
      const response = await api.get('/forms/');
      setForms(response.data);
      
      // Fetch submissions for each form
      const submissionsData = {};
      for (const form of response.data) {
        try {
          const submissionResponse = await api.get(`/form-submissions/?form=${form.id}`);
          // Only consider completed submissions
          const completedSubmission = submissionResponse.data.find(sub => sub.is_completed);
          submissionsData[form.id] = completedSubmission || null;
        } catch (err) {
          console.error(`Error fetching submissions for form ${form.id}:`, err);
        }
      }
      setSubmissions(submissionsData);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view these forms');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setError('Failed to load forms');
        console.error('Error loading forms:', err);
      }
    }
  };

  // Function to fetch active candidate sections
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      
      // For faculty members, fetch only candidates they're invited for
      if (currentUser && currentUser.user_type === 'faculty') {
        const invitationsResponse = await availabilityInvitationAPI.getInvitations();
        const invitedSections = [];
        
        // For each invitation, fetch the candidate section details
        for (const invitation of invitationsResponse.data) {
          try {
            const sectionResponse = await candidateSectionsAPI.getCandidateSectionById(invitation.candidate_section);
            
            // Get the season name
            const seasonResponse = await seasonsAPI.getSeasonById(sectionResponse.data.session);
            
            // Add season info to the section
            const sectionWithSeason = {
              ...sectionResponse.data,
              seasonName: seasonResponse.data.title
            };
            
            invitedSections.push(sectionWithSeason);
          } catch (err) {
            console.error(`Error fetching section ${invitation.candidate_section}:`, err);
          }
        }
        
        setCandidateSections(invitedSections);
      } 
      // For admins and superadmins, fetch all active candidates
      else {
        // First fetch active seasons
        const seasonsResponse = await seasonsAPI.getSeasons();
        const currentDate = new Date();
        const activeSeasons = seasonsResponse.data.filter(season => 
          parseISO(season.end_date) >= currentDate
        );
        
        // Then fetch candidate sections for each active season
        const allCandidateSections = [];
        for (const season of activeSeasons) {
          const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(season.id);
          // Add season info to each candidate section
          const sectionsWithSeason = sectionsResponse.data.map(section => ({
            ...section,
            seasonName: season.title
          }));
          allCandidateSections.push(...sectionsWithSeason);
        }
        
        setCandidateSections(allCandidateSections);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load candidates',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = (form) => {
    if (submissions[form.id]) {
      // If the form has been submitted, show it in a dialog
      setSelectedForm(form);
    } else {
      // If the form hasn't been submitted, navigate to the form page
      navigate(`/forms/${form.id}`);
    }
  };

  const handleCloseDialog = () => {
    setSelectedForm(null);
  };

  const handleFormSubmitted = async () => {
    handleCloseDialog();
    
    // Only fetch the submission for the submitted form
    try {
      const submissionResponse = await api.get(`/form-submissions/?form=${selectedForm.id}`);
      // Only consider completed submissions
      const completedSubmission = submissionResponse.data.find(sub => sub.is_completed);
      setSubmissions(prev => ({
        ...prev,
        [selectedForm.id]: completedSubmission || null
      }));
    } catch (err) {
      console.error(`Error fetching submission for form ${selectedForm.id}:`, err);
    }
  };

  // Faculty Availability Functions
  const openCandidateDialog = () => {
    setCandidateDialogOpen(true);
  };

  const closeCandidateDialog = () => {
    setCandidateDialogOpen(false);
  };

  const selectCandidate = (candidateSection) => {
    setSelectedCandidate(candidateSection);
    setTimeSlots([]);
    setNotes('');
    closeCandidateDialog();
    fetchExistingSubmissions(candidateSection.id);
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

  const handleSubmitAvailability = async () => {
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
      
      // Add debugging
      console.log('Sending availability data:', JSON.stringify(availabilityData));
      
      const response = await facultyAvailabilityAPI.submitAvailability(availabilityData);
      console.log('API response:', response);
      
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
      console.error('Error response data:', err.response?.data);
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
      if (selectedCandidate) {
        fetchExistingSubmissions(selectedCandidate.id);
      }
      setShowSubmissionDetails(null);
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Faculty Availability Section - Only shown to faculty/admin/superadmin */}
      {showFacultySection && (
        <>
          <Accordion 
            expanded={availabilityExpanded} 
            onChange={() => setAvailabilityExpanded(!availabilityExpanded)}
            sx={{ mb: 4 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">
                Faculty Availability Form
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Use this form to specify when you're available to meet with candidates.
              </Typography>
              
              {loading && !selectedCandidate && (
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {/* Candidate selection */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {selectedCandidate ? 
                      `Selected Candidate: ${selectedCandidate.candidate.first_name} ${selectedCandidate.candidate.last_name}` :
                      'Select a Candidate'
                    }
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={openCandidateDialog}
                  >
                    {selectedCandidate ? 'Change Candidate' : 'Select Candidate'}
                  </Button>
                </Box>
                
                {selectedCandidate && (
                  <Box>
                    {selectedCandidate.arrival_date && selectedCandidate.leaving_date && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        This candidate will be visiting from {format(parseISO(selectedCandidate.arrival_date), 'MMMM d')} to {format(parseISO(selectedCandidate.leaving_date), 'MMMM d, yyyy')}. Please select times within this range.
                      </Alert>
                    )}
                    
                    {/* Show existing submissions */}
                    {existingSubmissions.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Your Existing Availability Submissions:
                        </Typography>
                        
                        {existingSubmissions.map(submission => (
                          <Paper 
                            key={submission.id} 
                            sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2">
                                Submitted on {format(parseISO(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                              </Typography>
                              <Box>
                                <Button 
                                  variant="text"
                                  color="primary"
                                  size="small"
                                  onClick={() => setShowSubmissionDetails(showSubmissionDetails === submission.id ? null : submission.id)}
                                  sx={{ mr: 1 }}
                                >
                                  {showSubmissionDetails === submission.id ? 'Hide Details' : 'Show Details'}
                                </Button>
                                <Button 
                                  variant="outlined" 
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteSubmission(submission.id)}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                            
                            {showSubmissionDetails === submission.id && (
                              <Box sx={{ mt: 2 }}>
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
                                    <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                      <ListItemText
                                        primary={`${format(parseISO(slot.start_time), 'MMM d, yyyy h:mm a')} - ${format(parseISO(slot.end_time), 'h:mm a')}`}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    )}
                    
                    {/* Add new time slots */}
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Add New Availability:
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
                      onClick={handleSubmitAvailability}
                      disabled={loading || timeSlots.length === 0}
                    >
                      Submit Availability
                    </Button>
                  </Box>
                )}
              </Paper>
            </AccordionDetails>
          </Accordion>
          
          <Divider sx={{ mb: 4 }} />
        </>
      )}
      
      {/* Regular Forms Section */}
      <Typography variant="h5" gutterBottom>
        My Forms
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No forms available.
                </TableCell>
              </TableRow>
            ) : (
              forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>{form.title}</TableCell>
                  <TableCell>{form.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={submissions[form.id] ? 'Submitted' : 'Not Submitted'}
                      color={submissions[form.id] ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {submissions[form.id] ? (
                      <Tooltip title="View Submission">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewForm(form)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleViewForm(form)}
                      >
                        Fill Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form View Dialog */}
      <Dialog
        open={!!selectedForm}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedForm?.title}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedForm && (
            <FormSubmission
              formId={selectedForm.id}
              onClose={handleCloseDialog}
              onSubmitted={handleFormSubmitted}
              isViewOnly={!!submissions[selectedForm.id]}
              submission={submissions[selectedForm.id]}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Candidate Selection Dialog */}
      <Dialog
        open={candidateDialogOpen}
        onClose={closeCandidateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select a Candidate
          <IconButton
            aria-label="close"
            onClick={closeCandidateDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : candidateSections.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No candidates available at this time.
            </Alert>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {candidateSections.map(section => (
                <Grid item xs={12} sm={6} key={section.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {section.candidate.first_name} {section.candidate.last_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {section.seasonName}
                      </Typography>
                      {section.arrival_date && section.leaving_date && (
                        <Chip 
                          icon={<TimeIcon />}
                          label={`Visit: ${format(parseISO(section.arrival_date), 'MMM d')} - ${format(parseISO(section.leaving_date), 'MMM d')}`}
                          size="small"
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => selectCandidate(section)}
                      >
                        Select
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </Box>
  );
};

export default UserForms; 