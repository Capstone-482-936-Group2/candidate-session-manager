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
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Edit as EditIcon, ImportExport as ImportIcon } from '@mui/icons-material';
import { format, parseISO, parseJSON } from 'date-fns';
import { useParams, Link } from 'react-router-dom';
import { usersAPI, seasonsAPI, candidateSectionsAPI, timeSlotsAPI, timeSlotTemplatesAPI, facultyAvailabilityAPI } from '../../api/api';
import TemplateSelectionDialog from './TemplateSelectionDialog';
import FacultyAvailabilitySubmissions from './FacultyAvailabilitySubmissions';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const CandidateSectionManagement = () => {
  const { seasonId } = useParams();
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

  // Add a state for multiple time slots dialog
  const [multipleDialogOpen, setMultipleDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [multipleForm, setMultipleForm] = useState({
    startDate: new Date(),
    numberOfSlots: 1,
    daysBetween: 0,
    minutesBetween: 60
  });

  // Add a new state for template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Near the top of your component where other state variables are defined
  const [templates, setTemplates] = useState([]);

  // Update the state to include selectedCandidateSection
  const [selectedCandidateSection, setSelectedCandidateSection] = useState(null);

  // Add these state variables with your other state declarations
  const [facultyAvailability, setFacultyAvailability] = useState([]);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);

  // Add new state variables inside the CandidateSectionManagement component:
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);

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
    setSelectedCandidateSection(section);
    setTemplateDialogOpen(true);
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

  // Update handleTemplateSelect
  const handleTemplateSelect = (template, numberOfSlots, intervalMinutes, intervalDays, startDate) => {
    console.log('Selecting template:', template);
    
    // Get the template's start time
    let startTime = new Date(startDate);
    if (template.start_time) {
      const [hours, minutes] = template.start_time.split(':');
      startTime.setHours(parseInt(hours, 10));
      startTime.setMinutes(parseInt(minutes, 10));
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    // Store the template ID and keep the section ID
    setSelectedTemplate(template.id);
    setSelectedCandidateSection(selectedSection);
    setMultipleForm({
      startDate: startTime,
      numberOfSlots: numberOfSlots,
      daysBetween: intervalDays,
      minutesBetween: intervalMinutes || template.duration_minutes || 60
    });
    setMultipleDialogOpen(true);
  };

  // Update handleMultipleFormChange
  const handleMultipleFormChange = (e) => {
    const { name, value } = e.target;
    setMultipleForm(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
    console.log('Updated form:', name, value); // Debug log
  };

  // Update handleSubmitMultipleSlots
  const handleSubmitMultipleSlots = async () => {
    try {
      setLoading(true);
      
      if (!selectedTemplate || !selectedCandidateSection) {
        throw new Error("Missing template or section");
      }
      
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error("Selected template not found");
      }
      
      // Create base time slot data
      const timeSlotBase = {
        candidate_section: selectedCandidateSection.id,
        max_attendees: template.max_attendees || 1,
        description: template.description || '',
        is_visible: template.is_visible !== undefined ? template.is_visible : true,
        location: template.custom_location || '',
        notes: template.notes || ''
      };
      
      // Create time slots array
      const startDate = new Date(multipleForm.startDate);
      const timeSlots = [];
      
      for (let i = 0; i < multipleForm.numberOfSlots; i++) {
        // Create a new date object for each slot to avoid modifying the same reference
        const slotDate = new Date(startDate);
        
        if (multipleForm.daysBetween > 0) {
          // Add days without affecting the time
          slotDate.setDate(slotDate.getDate() + (i * multipleForm.daysBetween));
        } else if (multipleForm.minutesBetween > 0) {
          // Add minutes only if not using days
          slotDate.setMinutes(slotDate.getMinutes() + (i * multipleForm.minutesBetween));
        }
        
        const timeSlot = {
          ...timeSlotBase,
          start_time: slotDate.toISOString().slice(0, 19), // Format to remove milliseconds
        };
        
        if (template.has_end_time !== false) {
          const endDate = new Date(slotDate);
          endDate.setMinutes(endDate.getMinutes() + (template.duration_minutes || 60));
          timeSlot.end_time = endDate.toISOString().slice(0, 19);
        }
        
        timeSlots.push(timeSlot);
      }
      
      // Create all time slots
      for (const slot of timeSlots) {
        try {
          const response = await timeSlotsAPI.createTimeSlot(slot);
          console.log('Created time slot:', response.data);
        } catch (error) {
          console.error('Failed to create time slot:', error.response?.data);
          throw new Error(JSON.stringify(error.response?.data || {}));
        }
      }
      
      // Success handling
      await fetchCandidateSections();
      setSnackbar({
        open: true,
        message: `Successfully created ${timeSlots.length} time slots`,
        severity: 'success'
      });
      setMultipleDialogOpen(false);
      setTemplateDialogOpen(false);
      
    } catch (error) {
      console.error('Error creating time slots:', error);
      setSnackbar({
        open: true,
        message: `Failed to create time slots: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add these handler functions if they don't exist
  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setMultipleDialogOpen(false); // Also close multiple dialog if open
    setSelectedTemplate(null);
  };

  const handleCustomTimeSlot = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    setTimeSlotForm({
      start_time: now,
      end_time: oneHourLater,
      max_attendees: 1,
      location: '',
      description: '',
      is_visible: true,
      noEndTime: false
    });
    
    setTimeSlotDialogOpen(true);
  };

  // Add this with your other functions
  const fetchCandidateSections = async () => {
    try {
      setLoading(true);
      const response = await candidateSectionsAPI.getCandidateSections();
      setCandidateSections(response.data);
    } catch (err) {
      console.error('Error fetching candidate sections:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load candidate sections',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await timeSlotTemplatesAPI.getTemplates();
        console.log('Fetched templates:', response.data);
        setTemplates(response.data);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setSnackbar({
          open: true,
          message: 'Failed to load templates',
          severity: 'error'
        });
      }
    };
    
    fetchTemplates();
  }, []);

  // Add this function to fetch faculty availability for a candidate section
  const fetchFacultyAvailability = async (sectionId) => {
    try {
      setLoading(true);
      const response = await facultyAvailabilityAPI.getAvailabilityByCandidate(sectionId);
      console.log("Faculty availability data:", response.data);
      setFacultyAvailability(response.data);
    } catch (err) {
      console.error('Error fetching faculty availability:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load faculty availability',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to handle opening the import availability dialog
  const handleOpenAvailabilityDialog = async (section) => {
    setSelectedSection(section);
    setSelectedCandidateSection(section);
    await fetchFacultyAvailability(section.id);
    setAvailabilityDialogOpen(true);
  };

  // Add a function to close the dialog
  const handleCloseAvailabilityDialog = () => {
    setAvailabilityDialogOpen(false);
  };

  // Add a function to import faculty availability as time slots
  const handleImportAvailability = async (availabilityId) => {
    try {
      setLoading(true);
      const response = await facultyAvailabilityAPI.importAvailability(availabilityId);
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      
      // Refresh time slots after import
      await fetchCandidateSections();
      handleCloseAvailabilityDialog();
      
    } catch (err) {
      console.error('Error importing faculty availability:', err);
      setSnackbar({
        open: true,
        message: 'Failed to import faculty availability: ' + (err.response?.data?.detail || err.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add these functions to the component to handle the import functionality
  const handleOpenImportDialog = async () => {
    // Only open import dialog if a candidate is selected
    if (!sectionForm.candidate) {
      setSnackbar({
        open: true,
        message: 'Please select a candidate first',
        severity: 'warning'
      });
      return;
    }
    
    try {
      // Find the selected candidate's data
      const candidateId = parseInt(sectionForm.candidate);
      const selectedCandidate = users.find(user => user.id === candidateId);
      
      if (selectedCandidate && selectedCandidate.candidate_profile) {
        setCandidateProfile(selectedCandidate.candidate_profile);
        setSelectedDateRange(null);
        setImportDialogOpen(true);
      } else {
        setSnackbar({
          open: true,
          message: 'No profile data available for this candidate',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error handling import dialog:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load candidate profile data',
        severity: 'error'
      });
    }
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setSelectedDateRange(null);
  };

  const handleImportDateRange = () => {
    if (!selectedDateRange) {
      setSnackbar({
        open: true,
        message: 'Please select a date range',
        severity: 'warning'
      });
      return;
    }
    
    // Update the section form with the selected date range
    setSectionForm(prev => ({
      ...prev,
      arrival_date: new Date(selectedDateRange.startDate),
      leaving_date: new Date(selectedDateRange.endDate),
      // Set transportation needs based on candidate profile preferences
      needs_transportation: candidateProfile.travel_assistance === 'all' || 
                           candidateProfile.travel_assistance === 'some'
    }));
    
    setImportDialogOpen(false);
    
    setSnackbar({
      open: true,
      message: 'Date range imported successfully',
      severity: 'success'
    });
  };

  // Format date ranges for display
  const formatDateRange = (dateRange) => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return null;
    
    return `${format(new Date(dateRange.startDate), 'MMMM d, yyyy')} to ${format(new Date(dateRange.endDate), 'MMMM d, yyyy')}`;
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
                      startIcon={<ImportIcon />}
                      onClick={() => handleOpenAvailabilityDialog(section)}
                    >
                      Import Availability
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    startIcon={<ImportIcon />}
                    variant="outlined"
                    onClick={handleOpenImportDialog}
                    disabled={!sectionForm.candidate}
                  >
                    Import Candidate's Preferred Dates
                  </Button>
                </Box>
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    startIcon={<ImportIcon />}
                    variant="outlined"
                    onClick={handleOpenImportDialog}
                    disabled={!sectionForm.candidate}
                  >
                    Import Candidate's Preferred Dates
                  </Button>
                </Box>
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
        
        {/* Multiple Slots Dialog */}
        <Dialog
          open={multipleDialogOpen}
          onClose={() => {
            setMultipleDialogOpen(false);
            setSelectedTemplate(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Time Slots</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {selectedTemplate && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">
                    Template: {templates.find(t => t.id === selectedTemplate)?.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Creating {multipleForm.numberOfSlots} time slots
                    {multipleForm.daysBetween > 0 
                      ? ` spaced ${multipleForm.daysBetween} days apart`
                      : ` spaced ${multipleForm.minutesBetween} minutes apart`}
                  </Typography>
                  <Typography variant="body2">
                    Starting from: {new Date(multipleForm.startDate).toLocaleString()}
                  </Typography>
                </Box>
              )}

              {/* Preview section */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Time Slots Preview:</Typography>
                <List dense>
                  {Array.from({ length: Math.min(multipleForm.numberOfSlots, 5) }).map((_, index) => {
                    const date = new Date(multipleForm.startDate);
                    if (multipleForm.daysBetween > 0) {
                      date.setDate(date.getDate() + (index * multipleForm.daysBetween));
                    } else if (multipleForm.minutesBetween > 0) {
                      date.setMinutes(date.getMinutes() + (index * multipleForm.minutesBetween));
                    }
                    return (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={date.toLocaleString()} 
                        />
                      </ListItem>
                    );
                  })}
                  {multipleForm.numberOfSlots > 5 && (
                    <ListItem>
                      <ListItemText 
                        primary={`... and ${multipleForm.numberOfSlots - 5} more slots`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setMultipleDialogOpen(false);
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitMultipleSlots}
              variant="contained" 
              color="primary"
              disabled={!selectedTemplate || !selectedCandidateSection}
            >
              Create Slots
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Template Selection Dialog */}
        <TemplateSelectionDialog
          open={templateDialogOpen}
          onClose={handleCloseTemplateDialog}
          onSelectTemplate={handleTemplateSelect}
          onCustomOption={handleCustomTimeSlot}
        >
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Template</InputLabel>
            <Select
              value={selectedTemplate || ''}
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TemplateSelectionDialog>
        
        {/* Faculty Availability Import Dialog */}
        <Dialog 
          open={availabilityDialogOpen} 
          onClose={handleCloseAvailabilityDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Import Faculty Availability for {selectedSection?.candidate.first_name} {selectedSection?.candidate.last_name}
          </DialogTitle>
          <DialogContent>
            {facultyAvailability.length === 0 ? (
              <Typography sx={{ mt: 2 }}>
                No faculty availability submissions found for this candidate.
              </Typography>
            ) : (
              <List>
                {facultyAvailability.map((availability) => (
                  <ListItem key={availability.id} divider sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography variant="subtitle1">
                        {availability.faculty_name} ({availability.faculty_email})
                      </Typography>
                      <Typography variant="body2">
                        Room: {availability.faculty_room || 'Not specified'}
                      </Typography>
                    </Box>
                    
                    {availability.notes && (
                      <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                        Notes: {availability.notes}
                      </Typography>
                    )}
                    
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Available Times:
                    </Typography>
                    
                    <List dense sx={{ width: '100%' }}>
                      {availability.time_slots.map((slot, index) => (
                        <ListItem key={index} sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}>
                          <ListItemText
                            primary={`${format(parseISO(slot.start_time), 'MMM d, yyyy h:mm a')} - ${format(parseISO(slot.end_time), 'h:mm a')}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleImportAvailability(availability.id)}
                      sx={{ mt: 2, alignSelf: 'flex-end' }}
                    >
                      Import All Times
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAvailabilityDialog}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Import Preferred Dates Dialog */}
        <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Import Candidate's Preferred Visit Dates</DialogTitle>
          <DialogContent>
            {candidateProfile && (
              <>
                <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                  Select one of the date ranges provided by the candidate:
                </Typography>
                
                {(!candidateProfile.preferred_visit_dates || candidateProfile.preferred_visit_dates.length === 0) ? (
                  <Alert severity="info">
                    This candidate has not provided any preferred visit dates.
                  </Alert>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {candidateProfile.preferred_visit_dates.map((dateRange, index) => {
                      const formattedRange = formatDateRange(dateRange);
                      if (!formattedRange) return null;
                      
                      return (
                        <Box 
                          key={index} 
                          sx={{ 
                            p: 2, 
                            border: '1px solid',
                            borderColor: selectedDateRange === dateRange ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            mb: 2,
                            cursor: 'pointer',
                            bgcolor: selectedDateRange === dateRange ? 'action.selected' : 'background.paper'
                          }}
                          onClick={() => setSelectedDateRange(dateRange)}
                        >
                          <Typography>
                            Option {index + 1}: {formattedRange}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
                
                <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                  Travel assistance information: {candidateProfile.travel_assistance === 'all' 
                    ? 'Needs help with ALL travel arrangements' 
                    : candidateProfile.travel_assistance === 'some'
                    ? 'Needs help with SOME travel arrangements'
                    : 'Will book own travel arrangements'}
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseImportDialog}>Cancel</Button>
            <Button 
              onClick={handleImportDateRange} 
              variant="contained"
              disabled={!selectedDateRange}
            >
              Import Selected Date Range
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