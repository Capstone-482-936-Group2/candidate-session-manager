import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Grid, Button, TextField, FormControl, InputLabel, 
  Select, MenuItem, Box, List, ListItem, ListItemText, IconButton,
  Card, CardContent, CardActions, Divider, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Snackbar, Alert, CircularProgress, FormControlLabel, Switch
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersAPI, seasonsAPI, candidateSectionsAPI, timeSlotsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const CandidateSectionManagement = () => {
  const { seasonId } = useParams();
  const navigate = useNavigate();
  const [season, setSeason] = useState(null);
  const [candidateSections, setCandidateSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);
  const [editTimeSlotDialogOpen, setEditTimeSlotDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form states
  const [sectionForm, setSectionForm] = useState({
    description: '',
    candidate: '',
    needs_transportation: false,
    arrival_date: null,
    leaving_date: null
  });

  const [timeSlots, setTimeSlots] = useState([{
    start_time: new Date(),
    end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
    max_attendees: 1,
    location: '',
    description: '',
    is_visible: true,
    noEndTime: false
  }]);

  const [timeSlotForm, setTimeSlotForm] = useState({
    start_time: new Date(),
    end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
    max_attendees: 1,
    location: '',
    description: '',
    is_visible: true,
    noEndTime: false
  });

  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get recruiting season details
        const seasonResponse = await seasonsAPI.getSeasonById(seasonId);
        setSeason(seasonResponse.data);
        
        // Get candidate sections for this season only using the filtered endpoint
        console.log(`Fetching candidate sections for season ID: ${seasonId}`);
        const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
        console.log('Received candidate sections:', sectionsResponse.data);
        
        // Process the sections to ensure consistent data structure
        const processedSections = sectionsResponse.data.map(section => ({
          ...section,
          session: typeof section.session === 'object' ? section.session : { id: parseInt(seasonId) }
        }));
        
        console.log('Processed candidate sections:', processedSections);
        setCandidateSections(processedSections);
        
        // Get all users to populate candidate dropdown
        const usersResponse = await usersAPI.getUsers();
        // Filter for candidates only
        const candidates = usersResponse.data.filter(user => user.user_type === 'candidate');
        setUsers(candidates);
        
        // Calculate available candidates (those without sections in this season)
        const candidatesWithSections = processedSections.map(section => 
          section.candidate.id || (typeof section.candidate === 'number' ? section.candidate : null)
        ).filter(id => id !== null);
        
        console.log('Candidates who already have sections:', candidatesWithSections);
        
        const availableCandidatesList = candidates.filter(candidate => 
          !candidatesWithSections.includes(candidate.id)
        );
        
        console.log('Available candidates for new sections:', availableCandidatesList);
        setAvailableCandidates(availableCandidatesList);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load recruiting season data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  // Update available candidates when in edit mode to include the currently selected candidate
  useEffect(() => {
    if (selectedSection && users.length > 0) {
      // Get the current candidate ID being edited
      const editingCandidateId = selectedSection.candidate.id || 
        (typeof selectedSection.candidate === 'number' ? selectedSection.candidate : null);
      
      // Calculate candidates already assigned to sections, excluding the current one
      const candidatesWithSections = candidateSections
        .filter(section => section.id !== selectedSection.id)
        .map(section => section.candidate.id || 
          (typeof section.candidate === 'number' ? section.candidate : null)
        ).filter(id => id !== null);
      
      // Create updated list that includes current candidate and excludes others with sections
      const updatedAvailableCandidates = users.filter(candidate => 
        candidate.id === editingCandidateId || !candidatesWithSections.includes(candidate.id)
      );
      
      console.log('Available candidates in edit mode:', updatedAvailableCandidates);
      setAvailableCandidates(updatedAvailableCandidates);
    }
  }, [selectedSection, users, candidateSections]);

  const handleOpenDialog = () => {
    // Reset selected section to ensure we're not in edit mode
    setSelectedSection(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Reset form
    setSectionForm({
      description: '',
      candidate: '',
      needs_transportation: false,
      arrival_date: null,
      leaving_date: null
    });
  };

  const handleOpenEditDialog = (section) => {
    console.log('Opening edit dialog for section:', section);
    setSelectedSection(section);
    
    // Populate form with section data, converting date strings to Date objects
    setSectionForm({
      description: section.description || '',
      candidate: section.candidate.id || (typeof section.candidate === 'number' ? section.candidate : ''),
      needs_transportation: Boolean(section.needs_transportation),
      arrival_date: section.arrival_date ? parseISO(section.arrival_date) : null,
      leaving_date: section.leaving_date ? parseISO(section.leaving_date) : null
    });
    
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedSection(null);
    // Reset form
    setSectionForm({
      description: '',
      candidate: '',
      needs_transportation: false,
      arrival_date: null,
      leaving_date: null
    });
  };

  const handleOpenTimeSlotDialog = (section) => {
    setSelectedSection(section);
    // Create dates without timezone conversion
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    setTimeSlots([{
      start_time: now,
      end_time: oneHourLater,
      max_attendees: 1,
      location: '',
      description: '',
      is_visible: true,
      noEndTime: false
    }]);
    setTimeSlotDialogOpen(true);
  };

  const handleCloseTimeSlotDialog = () => {
    setTimeSlotDialogOpen(false);
    setSelectedSection(null);
  };

  const handleSectionFormChange = (e) => {
    const { name, value, checked } = e.target;
    setSectionForm(prev => ({
      ...prev,
      [name]: name === 'needs_transportation' ? checked : value
    }));
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
    // Add a new time slot starting 1 hour after the last one
    const lastSlot = timeSlots[timeSlots.length - 1];
    const newStartTime = new Date(lastSlot.end_time?.getTime() || lastSlot.start_time.getTime() + 60 * 60 * 1000);
    const newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000);
    
    setTimeSlots([
      ...timeSlots,
      {
        start_time: newStartTime,
        end_time: newEndTime,
        max_attendees: 1,
        location: '',
        description: '',
        is_visible: true,
        noEndTime: false
      }
    ]);
  };

  const removeTimeSlot = (index) => {
    const updatedTimeSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedTimeSlots);
  };

  // Format dates to YYYY-MM-DD without timezone adjustment
  const formatDateToUTC = (date) => {
    if (!date) return null;
    return format(new Date(date), 'yyyy-MM-dd');
  };

  const handleCreateSection = async () => {
    try {
      // Check if the candidate already has a section
      const candidateAlreadyHasSection = candidateSections.some(
        section => section.candidate.id === parseInt(sectionForm.candidate)
      );
      
      if (candidateAlreadyHasSection) {
        setSnackbar({
          open: true,
          message: 'This candidate already has a section. Each candidate can only have one section.',
          severity: 'error'
        });
        return;
      }
      
      // Find the candidate name for the default title
      const candidateId = parseInt(sectionForm.candidate);
      const selectedCandidate = users.find(user => user.id === candidateId);
      const defaultTitle = selectedCandidate ? 
        `Session for ${selectedCandidate.first_name} ${selectedCandidate.last_name}` : 
        'Candidate Session';
      
      // Format dates to YYYY-MM-DD in UTC
      const formattedArrivalDate = formatDateToUTC(sectionForm.arrival_date);
      const formattedLeavingDate = formatDateToUTC(sectionForm.leaving_date);
      
      // Create new candidate section with all required fields
      const newSection = {
        title: defaultTitle,
        description: sectionForm.description || '',
        location: 'To be determined',
        candidate: candidateId,
        session: parseInt(seasonId),
        needs_transportation: Boolean(sectionForm.needs_transportation),
        arrival_date: formattedArrivalDate,
        leaving_date: formattedLeavingDate
      };
      
      console.log('Sending candidate section data:', newSection);
      const response = await candidateSectionsAPI.createCandidateSection(newSection);
      
      // Format the response with the full candidate object before updating state
      const formattedResponse = {
        ...response.data,
        candidate: selectedCandidate // Replace candidate ID with full candidate object
      };
      
      // Update the candidate sections list with properly formatted data
      const updatedSections = [...candidateSections, formattedResponse];
      setCandidateSections(updatedSections);
      
      // Update available candidates to reflect the new section
      // Calculate candidates who now have sections
      const candidatesWithSections = updatedSections.map(section => 
        section.candidate.id || (typeof section.candidate === 'number' ? section.candidate : null)
      ).filter(id => id !== null);
      
      // Update available candidates list
      const updatedAvailableCandidates = users.filter(candidate => 
        !candidatesWithSections.includes(candidate.id)
      );
      setAvailableCandidates(updatedAvailableCandidates);
      
      // Close the dialog and show success message
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Candidate section created successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating candidate section:', err);
      const errorDetail = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : err.message);
      
      setSnackbar({
        open: true,
        message: 'Failed to create candidate section: ' + errorDetail,
        severity: 'error'
      });
    }
  };

  const handleUpdateSection = async () => {
    if (!selectedSection) return;
    
    try {
      // Check if the candidate already has a different section
      const candidateHasDifferentSection = candidateSections.some(
        section => section.candidate.id === parseInt(sectionForm.candidate) && section.id !== selectedSection.id
      );
      
      if (candidateHasDifferentSection) {
        setSnackbar({
          open: true,
          message: 'This candidate already has a different section. Each candidate can only have one section.',
          severity: 'error'
        });
        return;
      }
      
      // Find the candidate name for the default title
      const candidateId = parseInt(sectionForm.candidate);
      const selectedCandidate = users.find(user => user.id === candidateId);
      const defaultTitle = selectedCandidate ? 
        `Session for ${selectedCandidate.first_name} ${selectedCandidate.last_name}` : 
        'Candidate Session';
      
      // Format dates to YYYY-MM-DD in UTC
      const formattedArrivalDate = formatDateToUTC(sectionForm.arrival_date);
      const formattedLeavingDate = formatDateToUTC(sectionForm.leaving_date);
      
      // Update candidate section with all required fields
      const updatedSection = {
        title: defaultTitle,
        description: sectionForm.description || '',
        location: selectedSection.location || 'To be determined',
        candidate: candidateId,
        session: parseInt(seasonId),
        needs_transportation: Boolean(sectionForm.needs_transportation),
        arrival_date: formattedArrivalDate,
        leaving_date: formattedLeavingDate
      };
      
      console.log('Sending updated section data:', updatedSection);
      await candidateSectionsAPI.updateCandidateSection(selectedSection.id, updatedSection);
      
      // Refresh the candidate sections data to include time slots
      const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(sectionsResponse.data);
      
      // Close the dialog and show success message
      handleCloseEditDialog();
      setSnackbar({
        open: true,
        message: 'Candidate section updated successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating candidate section:', err);
      const errorDetail = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : err.message);
      
      setSnackbar({
        open: true,
        message: 'Failed to update candidate section: ' + errorDetail,
        severity: 'error'
      });
    }
  };

  const handleAddTimeSlots = async () => {
    if (!selectedSection) return;
    
    try {
      // Create time slots one by one
      const createdSlots = [];
      
      for (const slot of timeSlots) {
        // Use exact time entered
        const timeSlotData = {
          candidate_section: selectedSection.id,
          start_time: slot.start_time.toISOString().slice(0, 19),
          end_time: slot.noEndTime ? null : slot.end_time.toISOString().slice(0, 19),
          max_attendees: parseInt(slot.max_attendees),
          location: slot.location || '',
          description: slot.description || '',
          is_visible: slot.noEndTime ? false : (slot.is_visible !== undefined ? slot.is_visible : true)
        };
        
        console.log('Creating time slot:', timeSlotData);
        const response = await timeSlotsAPI.createTimeSlot(timeSlotData);
        createdSlots.push(response.data);
      }
      
      // Refresh the candidate sections data to include new time slots
      const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(sectionsResponse.data);
      
      // Close dialog and show success message
      handleCloseTimeSlotDialog();
      setSnackbar({
        open: true,
        message: `Successfully added ${createdSlots.length} time slots!`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error adding time slots:', err);
      setSnackbar({
        open: true,
        message: 'Failed to add time slots: ' + (err.response?.data?.message || err.response?.data?.detail || err.message),
        severity: 'error'
      });
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this candidate section? This will also delete all associated time slots. This action cannot be undone.')) {
      return;
    }
    
    try {
      await candidateSectionsAPI.deleteCandidateSection(sectionId);
      
      // Update the sections list
      const updatedSections = candidateSections.filter(section => section.id !== sectionId);
      setCandidateSections(updatedSections);
      
      // Update available candidates to reflect the deletion
      // Calculate candidates who still have sections
      const candidatesWithSections = updatedSections.map(section => 
        section.candidate.id || (typeof section.candidate === 'number' ? section.candidate : null)
      ).filter(id => id !== null);
      
      // Update available candidates list
      const updatedAvailableCandidates = users.filter(candidate => 
        !candidatesWithSections.includes(candidate.id)
      );
      setAvailableCandidates(updatedAvailableCandidates);
      
      setSnackbar({
        open: true,
        message: 'Candidate section deleted successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting candidate section:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete candidate section',
        severity: 'error'
      });
    }
  };

  const handleDeleteTimeSlot = async (timeSlotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot? All registrations for this time slot will also be deleted. This action cannot be undone.')) {
      return;
    }
    
    try {
      await timeSlotsAPI.deleteTimeSlot(timeSlotId);
      
      // Refresh the candidate sections data to reflect the deleted time slot
      const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(sectionsResponse.data);
      
      setSnackbar({
        open: true,
        message: 'Time slot deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting time slot:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete time slot',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenEditTimeSlotDialog = (slot) => {
    const hasNoEndTime = !slot.end_time;
    setTimeSlotForm({
      start_time: slot.start_time ? new Date(slot.start_time) : null,
      end_time: slot.end_time ? new Date(slot.end_time) : null,
      max_attendees: hasNoEndTime ? 0 : (slot.max_attendees || 1),
      location: slot.location || '',
      description: slot.description || '',
      is_visible: hasNoEndTime ? false : (slot.is_visible !== undefined ? slot.is_visible : true),
      noEndTime: hasNoEndTime
    });
    setSelectedTimeSlot(slot);
    setEditTimeSlotDialogOpen(true);
  };

  const handleCloseEditTimeSlotDialog = () => {
    setEditTimeSlotDialogOpen(false);
    setSelectedTimeSlot(null);
    setSelectedSection(null);
    setTimeSlotForm({
      start_time: new Date(),
      end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
      max_attendees: 1,
      location: '',
      description: '',
      is_visible: true,
      noEndTime: false
    });
  };

  const handleTimeSlotFormChange = (field, value) => {
    setTimeSlotForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateTimeSlot = async () => {
    if (!selectedTimeSlot) return;

    try {
      const updatedData = {
        start_time: timeSlotForm.start_time.toISOString().slice(0, 19),
        end_time: timeSlotForm.noEndTime ? null : timeSlotForm.end_time.toISOString().slice(0, 19),
        max_attendees: parseInt(timeSlotForm.max_attendees),
        location: timeSlotForm.location || '',
        description: timeSlotForm.description || '',
        is_visible: timeSlotForm.noEndTime ? false : timeSlotForm.is_visible
      };
      
      console.log('Updating time slot:', updatedData);
      await timeSlotsAPI.updateTimeSlot(selectedTimeSlot.id, updatedData);
      
      // Refresh the candidate sections data to include updated time slot
      const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(sectionsResponse.data);
      
      // Close dialog and show success message
      handleCloseEditTimeSlotDialog();
      setSnackbar({
        open: true,
        message: 'Time slot updated successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating time slot:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update time slot: ' + (err.response?.data?.message || err.response?.data?.detail || err.message),
        severity: 'error'
      });
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">{error}</Typography>
      <Button 
        startIcon={<ArrowBackIcon />} 
        component={Link} 
        to="/admin-dashboard"
        state={{ defaultTab: 1 }}
        sx={{ mt: 2 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );

  if (!season) return (
    <Box sx={{ p: 3 }}>
      <Typography>Recruiting season not found</Typography>
      <Button 
        startIcon={<ArrowBackIcon />} 
        component={Link} 
        to="/admin-dashboard"
        state={{ defaultTab: 1 }}
        sx={{ mt: 2 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            component={Link} 
            to="/admin-dashboard"
            state={{ defaultTab: 1 }}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {season.title}: Candidate Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Candidate Section
          </Button>
        </Box>
        
        <Typography variant="body1" paragraph>
          {season.description}
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom>
          Season Period: {format(new Date(season.start_date), 'MMM d, yyyy')} - {format(new Date(season.end_date), 'MMM d, yyyy')}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {candidateSections.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">No Candidate Sections</Typography>
            <Typography variant="body2" color="textSecondary">
              Add your first candidate section using the "Add Candidate Section" button.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {candidateSections.map(section => (
              <Grid item xs={12} md={6} key={section.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h5">
                      {section.candidate.first_name} {section.candidate.last_name}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom>
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
                        {section.time_slots.map((slot, index) => (
                          <ListItem
                            key={slot.id}
                            secondaryAction={
                              <Box>
                                <IconButton
                                  edge="end"
                                  aria-label="edit"
                                  onClick={() => handleOpenEditTimeSlotDialog(slot)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  onClick={() => handleDeleteTimeSlot(slot.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            }
                            sx={{ 
                              backgroundColor: slot.attendees?.length >= slot.max_attendees ? '#f5f5f5' : 'white',
                              borderRadius: 1,
                              mb: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <ListItemText
                              primary={`${slot.start_time ? format(new Date(slot.start_time), 'MMM d, yyyy h:mm a') : 'No start time'}${
                                slot.end_time 
                                  ? ` - ${format(new Date(slot.end_time), 'h:mm a')}` 
                                  : ' (No end time)'
                              }`}
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
                                  </Box>
                                  {slot.attendees && slot.attendees.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Registered Members:
                                      </Typography>
                                      <List dense>
                                        {slot.attendees.map(attendee => (
                                          <ListItem key={attendee.user.id} sx={{ py: 0.5 }}>
                                            <ListItemText
                                              primary={`${attendee.user.first_name} ${attendee.user.last_name}`}
                                              secondary={attendee.user.email}
                                            />
                                          </ListItem>
                                        ))}
                                      </List>
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No time slots available.
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small"
                      onClick={() => handleOpenTimeSlotDialog(section)}
                    >
                      Add Time Slots
                    </Button>
                    <Button 
                      size="small" 
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEditDialog(section)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      Delete Section
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Add Candidate Section Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Add Candidate Section</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Candidate</InputLabel>
                  <Select
                    name="candidate"
                    value={sectionForm.candidate}
                    onChange={handleSectionFormChange}
                    label="Candidate"
                  >
                    {(editDialogOpen ? users : availableCandidates).map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Arrival Date"
                  value={sectionForm.arrival_date}
                  onChange={(newValue) => handleSectionFormChange({ target: { name: 'arrival_date', value: newValue } })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Leaving Date"
                  value={sectionForm.leaving_date}
                  onChange={(newValue) => handleSectionFormChange({ target: { name: 'leaving_date', value: newValue } })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={sectionForm.arrival_date}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={sectionForm.description}
                  onChange={handleSectionFormChange}
                  placeholder="Provide details about this candidate section"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <label>
                    <input
                      type="checkbox"
                      name="needs_transportation"
                      checked={sectionForm.needs_transportation}
                      onChange={handleSectionFormChange}
                    />
                    {' '}Candidate needs transportation
                  </label>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleCreateSection} 
              variant="contained"
              disabled={!sectionForm.candidate}
            >
              Create Section
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Edit Candidate Section Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
          <DialogTitle>Edit Section for {selectedSection?.candidate.first_name} {selectedSection?.candidate.last_name}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Candidate</InputLabel>
                  <Select
                    name="candidate"
                    value={sectionForm.candidate}
                    onChange={handleSectionFormChange}
                    label="Candidate"
                  >
                    {users.map(user => (
                      <MenuItem 
                        key={user.id} 
                        value={user.id}
                        disabled={
                          candidateSections.some(section => 
                            section.candidate.id === user.id && 
                            (!selectedSection || section.id !== selectedSection.id)
                          )
                        }
                      >
                        {user.first_name} {user.last_name} ({user.email})
                        {candidateSections.some(section => section.candidate.id === user.id && 
                          (!selectedSection || section.id !== selectedSection.id)) ? 
                          ' (already has a section)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Arrival Date"
                  value={sectionForm.arrival_date}
                  onChange={(newValue) => handleSectionFormChange({ target: { name: 'arrival_date', value: newValue } })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Leaving Date"
                  value={sectionForm.leaving_date}
                  onChange={(newValue) => handleSectionFormChange({ target: { name: 'leaving_date', value: newValue } })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={sectionForm.arrival_date}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={sectionForm.description}
                  onChange={handleSectionFormChange}
                  placeholder="Provide details about this candidate section"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <label>
                    <input
                      type="checkbox"
                      name="needs_transportation"
                      checked={sectionForm.needs_transportation}
                      onChange={handleSectionFormChange}
                    />
                    {' '}Candidate needs transportation
                  </label>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button 
              onClick={handleUpdateSection} 
              variant="contained"
              disabled={!sectionForm.candidate}
            >
              Update Section
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Add Time Slots Dialog */}
        <Dialog open={timeSlotDialogOpen} onClose={handleCloseTimeSlotDialog} maxWidth="md" fullWidth>
          <DialogTitle>Add Time Slots for {selectedSection?.candidate.first_name} {selectedSection?.candidate.last_name}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              Add one or more time slots for faculty to sign up to meet with this candidate.
            </Typography>
            
            {timeSlots.map((slot, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 3 }}>
                <Grid item xs={12} md={5}>
                  <DateTimePicker
                    label="Start Time"
                    value={slot.start_time}
                    onChange={(newValue) => handleTimeSlotChange(index, 'start_time', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    timezone="local"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <DateTimePicker
                    label="End Time"
                    value={slot.end_time}
                    onChange={(newValue) => handleTimeSlotChange(index, 'end_time', newValue)}
                    slotProps={{ textField: { fullWidth: true, required: !slot.noEndTime, disabled: slot.noEndTime } }}
                    minDateTime={slot.start_time}
                    disabled={slot.noEndTime}
                  />
                </Grid>
                <Grid item xs={8} md={1}>
                  <TextField
                    label="Max"
                    type="number"
                    value={slot.max_attendees}
                    onChange={(e) => handleTimeSlotChange(index, 'max_attendees', parseInt(e.target.value))}
                    inputProps={{ min: slot.noEndTime ? 0 : 1 }}
                    fullWidth
                    disabled={slot.noEndTime}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={slot.noEndTime}
                        onChange={(e) => {
                          const newNoEndTime = e.target.checked;
                          const updatedTimeSlots = [...timeSlots];
                          updatedTimeSlots[index] = {
                            ...updatedTimeSlots[index],
                            noEndTime: newNoEndTime,
                            // If noEndTime is true, set end_time to null, is_visible to false, and max_attendees to 0
                            end_time: newNoEndTime ? null : (updatedTimeSlots[index].end_time || new Date(slot.start_time.getTime() + 60 * 60 * 1000)),
                            is_visible: newNoEndTime ? false : updatedTimeSlots[index].is_visible,
                            max_attendees: newNoEndTime ? 0 : updatedTimeSlots[index].max_attendees || 1
                          };
                          setTimeSlots(updatedTimeSlots);
                        }}
                        color="primary"
                      />
                    }
                    label="No End Time"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={slot.is_visible !== undefined ? slot.is_visible : true}
                        onChange={(e) => handleTimeSlotChange(index, 'is_visible', e.target.checked)}
                        color="primary"
                        disabled={slot.noEndTime}
                      />
                    }
                    label="Visible on calendar"
                  />
                </Grid>
                <Grid item xs={4} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  {timeSlots.length > 1 && (
                    <IconButton onClick={() => removeTimeSlot(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Location"
                    value={slot.location}
                    onChange={(e) => handleTimeSlotChange(index, 'location', e.target.value)}
                    fullWidth
                    placeholder="e.g., Conference Room A"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={slot.description}
                    onChange={(e) => handleTimeSlotChange(index, 'description', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Optional details about this specific time slot"
                  />
                </Grid>
              </Grid>
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
            <Button 
              onClick={handleAddTimeSlots} 
              variant="contained"
            >
              Save Time Slots
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Edit Time Slot Dialog */}
        <Dialog open={editTimeSlotDialogOpen} onClose={handleCloseEditTimeSlotDialog} maxWidth="md" fullWidth>
          <DialogTitle>Edit Time Slot for {selectedSection?.candidate.first_name} {selectedSection?.candidate.last_name}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              Edit the time slot details below.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <DateTimePicker
                  label="Start Time"
                  value={timeSlotForm.start_time}
                  onChange={(newValue) => handleTimeSlotFormChange('start_time', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  timezone="local"
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <DateTimePicker
                  label="End Time"
                  value={timeSlotForm.end_time}
                  onChange={(newValue) => handleTimeSlotFormChange('end_time', newValue)}
                  slotProps={{ textField: { fullWidth: true, required: !timeSlotForm.noEndTime, disabled: timeSlotForm.noEndTime } }}
                  minDateTime={timeSlotForm.start_time}
                  disabled={timeSlotForm.noEndTime}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Max Attendees"
                  type="number"
                  value={timeSlotForm.max_attendees}
                  onChange={(e) => handleTimeSlotFormChange('max_attendees', parseInt(e.target.value))}
                  inputProps={{ min: timeSlotForm.noEndTime ? 0 : 1 }}
                  fullWidth
                  disabled={timeSlotForm.noEndTime}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  value={timeSlotForm.location}
                  onChange={(e) => handleTimeSlotFormChange('location', e.target.value)}
                  fullWidth
                  placeholder="e.g., Conference Room A"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={timeSlotForm.description}
                  onChange={(e) => handleTimeSlotFormChange('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Optional details about this time slot"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={timeSlotForm.noEndTime}
                      onChange={(e) => {
                        const newNoEndTime = e.target.checked;
                        setTimeSlotForm({
                          ...timeSlotForm,
                          noEndTime: newNoEndTime,
                          // If noEndTime is true, set end_time to null, is_visible to false, and max_attendees to 0
                          end_time: newNoEndTime ? null : (timeSlotForm.end_time || new Date(timeSlotForm.start_time.getTime() + 60 * 60 * 1000)),
                          is_visible: newNoEndTime ? false : timeSlotForm.is_visible,
                          max_attendees: newNoEndTime ? 0 : (timeSlotForm.max_attendees || 1)
                        });
                      }}
                      color="primary"
                    />
                  }
                  label="No End Time"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={timeSlotForm.is_visible}
                      onChange={(e) => setTimeSlotForm({
                        ...timeSlotForm,
                        is_visible: e.target.checked
                      })}
                      name="is_visible"
                      disabled={timeSlotForm.noEndTime}
                    />
                  }
                  label="Visible on calendar"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditTimeSlotDialog}>Cancel</Button>
            <Button 
              onClick={handleUpdateTimeSlot} 
              variant="contained"
            >
              Update Time Slot
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CandidateSectionManagement; 