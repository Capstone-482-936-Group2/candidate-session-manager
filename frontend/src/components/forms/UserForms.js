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
  Snackbar,
  Container,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  Edit as EditIcon, 
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  CheckCircleOutline as CheckIcon,
  HourglassEmpty as PendingIcon,
  ErrorOutline as ErrorIcon,
  Assignment as FormIcon
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
  const theme = useTheme();
  
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

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Render form table content
  const renderForms = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }

    if (forms.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No forms are available for you at this time.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {forms.map(form => {
          const submission = submissions[form.id];
          const isCompleted = submission?.is_completed;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={form.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  borderTop: '4px solid',
                  borderColor: isCompleted ? 'success.main' : 'primary.main',
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ 
                  bgcolor: isCompleted ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.primary.main, 0.05),
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FormIcon 
                    sx={{ 
                      mr: 1, 
                      color: isCompleted ? 'success.main' : 'primary.main' 
                    }} 
                  />
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600}
                    sx={{ 
                      color: isCompleted ? 'success.main' : 'primary.main',
                      flexGrow: 1
                    }}
                  >
                    {form.title}
                  </Typography>
                  <Chip 
                    size="small"
                    label={isCompleted ? "Completed" : "Pending"}
                    color={isCompleted ? "success" : "primary"}
                    sx={{ fontWeight: 500 }}
                    icon={isCompleted ? <CheckIcon /> : <PendingIcon />}
                  />
                </Box>
                
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      height: '3.6em' // Approximately 3 lines
                    }}
                  >
                    {form.description || "No description available"}
                  </Typography>
                  
                  {form.due_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Due: {new Date(form.due_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant={isCompleted ? "outlined" : "contained"}
                    color={isCompleted ? "success" : "primary"}
                    fullWidth
                    onClick={() => handleViewForm(form)}
                    endIcon={isCompleted ? <VisibilityIcon /> : <EditIcon />}
                    sx={{ 
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {isCompleted ? "View Submission" : "Complete Form"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom color="primary.dark">
          Your Forms
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and complete your required forms
        </Typography>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.25rem'
            }
          }}
        >
          {error}
        </Alert>
      )}
      
      {/* Faculty Availability Section - Now placed above other forms */}
      {showFacultySection && (
        <Card 
          elevation={2} 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            overflow: 'hidden',
            borderLeft: '4px solid',
            borderColor: 'secondary.main',
          }}
        >
          <Accordion 
            expanded={availabilityExpanded} 
            onChange={() => setAvailabilityExpanded(!availabilityExpanded)}
            disableGutters
            elevation={0}
            sx={{ 
              '&.MuiAccordion-root:before': {
                display: 'none',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" fontWeight={600} color="secondary.dark">
                Faculty Availability Form
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              {selectedCandidate ? (
                <Box>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Availability for {selectedCandidate.candidate?.first_name} {selectedCandidate.candidate?.last_name}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      onClick={openCandidateDialog}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Change Candidate
                    </Button>
                  </Box>
                  
                  {selectedCandidate?.arrival_date && selectedCandidate?.leaving_date && (
                    <Box sx={{ 
                      mb: 3, 
                      p: 2, 
                      bgcolor: alpha(theme.palette.info.main, 0.1), 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.2),
                    }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary.dark">
                        Candidate Visit: {format(parseISO(selectedCandidate.arrival_date), 'MMMM d')} - {format(parseISO(selectedCandidate.leaving_date), 'MMMM d, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Please schedule your availability within these dates
                      </Typography>
                    </Box>
                  )}
                  
                  {existingSubmissions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Your Previous Submissions:
                      </Typography>
                      <List sx={{ 
                        bgcolor: 'background.paper', 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        {existingSubmissions.map((submission) => (
                          <React.Fragment key={submission.id}>
                            <ListItem
                              secondaryAction={
                                <IconButton edge="end" onClick={() => handleDeleteSubmission(submission.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body1" fontWeight={500}>
                                    {submission.time_slots.length} time slot(s) submitted
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(submission.created_at).toLocaleString()}
                                  </Typography>
                                }
                                onClick={() => setShowSubmissionDetails(submission.id === showSubmissionDetails ? null : submission.id)}
                                sx={{ cursor: 'pointer' }}
                              />
                            </ListItem>
                            
                            {showSubmissionDetails === submission.id && (
                              <Box sx={{ px: 2, pb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Time Slots:
                                </Typography>
                                <Box sx={{ pl: 2 }}>
                                  {submission.time_slots.map((slot, index) => (
                                    <Box key={index} sx={{ mb: 1 }}>
                                      <Typography variant="body2">
                                        Start: {new Date(slot.start_time).toLocaleString()}
                                      </Typography>
                                      <Typography variant="body2">
                                        End: {new Date(slot.end_time).toLocaleString()}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                                
                                {submission.notes && (
                                  <>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                      Notes:
                                    </Typography>
                                    <Typography variant="body2" sx={{ pl: 2 }}>
                                      {submission.notes}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            )}
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  )}
                  
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Add New Availability:
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      {timeSlots.map((slot, index) => (
                        <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={5}>
                            <DateTimePicker
                              label="Start Time"
                              value={slot.start_time}
                              onChange={(newValue) => handleTimeSlotChange(index, 'start_time', newValue)}
                              renderInput={(params) => <TextField {...params} fullWidth />}
                              minDateTime={selectedCandidate?.arrival_date ? parseISO(selectedCandidate.arrival_date) : undefined}
                              maxDateTime={selectedCandidate?.leaving_date ? (() => {
                                const date = parseISO(selectedCandidate.leaving_date);
                                date.setHours(23, 59, 59);
                                return date;
                              })() : undefined}
                            />
                          </Grid>
                          <Grid item xs={12} sm={5}>
                            <DateTimePicker
                              label="End Time"
                              value={slot.end_time}
                              onChange={(newValue) => handleTimeSlotChange(index, 'end_time', newValue)}
                              renderInput={(params) => <TextField {...params} fullWidth />}
                              minDateTime={selectedCandidate?.arrival_date ? parseISO(selectedCandidate.arrival_date) : undefined}
                              maxDateTime={selectedCandidate?.leaving_date ? (() => {
                                const date = parseISO(selectedCandidate.leaving_date);
                                date.setHours(23, 59, 59);
                                return date;
                              })() : undefined}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleRemoveTimeSlot(index)}
                              fullWidth
                              sx={{ 
                                height: '56px',
                                borderRadius: 1.5
                              }}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      ))}
                    </LocalizationProvider>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleAddTimeSlot}
                      sx={{ 
                        mt: 1,
                        borderRadius: 1.5
                      }}
                    >
                      Add Time Slot
                    </Button>
                  </Box>
                  
                  <TextField
                    label="Additional Notes"
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitAvailability}
                      disabled={timeSlots.length === 0}
                      sx={{ 
                        px: 3,
                        py: 1,
                        borderRadius: 1.5
                      }}
                    >
                      Submit Availability
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    Please select a candidate to provide your availability
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={openCandidateDialog}
                    sx={{ 
                      mt: 2,
                      borderRadius: 1.5
                    }}
                  >
                    Select Candidate
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Card>
      )}
      
      {/* Regular forms section now comes after faculty availability */}
      {renderForms()}
      
      {/* Candidate Selection Dialog */}
      <Dialog
        open={candidateDialogOpen}
        onClose={closeCandidateDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" fontWeight={600}>
            Select a Candidate
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {candidateSections.length > 0 ? (
            <List>
              {candidateSections.map((section) => (
                <ListItem 
                  button 
                  key={section.id} 
                  onClick={() => selectCandidate(section)}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography fontWeight={500}>
                        {section.candidate?.first_name} {section.candidate?.last_name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {section.seasonName}
                        </Typography>
                        {section.arrival_date && section.leaving_date && (
                          <Typography variant="body2" color="primary.main" fontWeight={500}>
                            Visit: {format(parseISO(section.arrival_date), 'MMM d')} - {format(parseISO(section.leaving_date), 'MMM d, yyyy')}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
              No candidates available at this time.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={closeCandidateDialog} sx={{ borderRadius: 1.5 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Form View Dialog */}
      <Dialog
        open={Boolean(selectedForm)}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 3, 
          sx: { borderRadius: 2 }
        }}
      >
        {selectedForm && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 3,
              py: 2
            }}>
              <Typography variant="h5" component="div" fontWeight={600} color="primary.dark">
                {selectedForm.title}
              </Typography>
              <IconButton onClick={handleCloseDialog} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
              <FormSubmission 
                formId={selectedForm.id}
                isViewOnly={Boolean(submissions[selectedForm.id]?.is_completed)}
                submission={submissions[selectedForm.id]}
                onSubmitted={handleFormSubmitted}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ 
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
            fontWeight: 500
          }
        }}
      />
    </Container>
  );
};

export default UserForms; 