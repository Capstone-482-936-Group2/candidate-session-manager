import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Checkbox,
  Grid,
  Switch,
  FormControlLabel,
  FormHelperText,
  Autocomplete,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  PersonAdd as PersonAddIcon,
  ImportExport as ImportIcon,
} from '@mui/icons-material';
import api, { usersAPI, availabilityInvitationAPI, seasonsAPI, candidateSectionsAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import FormSubmissions from '../components/admin/FormSubmissions';
import FacultyAvailabilitySubmissions from '../components/admin/FacultyAvailabilitySubmissions';
import { format, parseISO } from 'date-fns';
import { useTheme, alpha } from '@mui/material/styles';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'date', label: 'Date' },
  { value: 'date_range', label: 'Date Range' },
];

const FormManagement = () => {
  const { currentUser, isAdmin } = useAuth();
  const [forms, setForms] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSendLinkDialog, setOpenSendLinkDialog] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    form_fields: [],
    assigned_to_ids: [],
    is_active: true,
  });
  const [selectedFormForSubmissions, setSelectedFormForSubmissions] = useState(null);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [candidateSections, setCandidateSections] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const theme = useTheme();

  useEffect(() => {
    fetchForms();
    if (isAdmin) {
      fetchUsers();
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    // Add a virtual "Faculty Availability" form to the forms list
    const facultyAvailabilityForm = {
      id: 'faculty-availability',
      title: 'Faculty Availability Form',
      description: 'Invite faculty members to submit their availability for candidate meetings.',
      is_active: true,
      isVirtual: true // Flag to identify it's not a real form
    };
    
    // Check if the virtual form is already in the list
    const formExists = forms.some(form => form.id === 'faculty-availability');
    
    if (!formExists && forms.length > 0) {
      setForms(prevForms => [facultyAvailabilityForm, ...prevForms]);
    }
  }, [forms]);

  const fetchForms = async () => {
    try {
      const response = await api.get('/forms/');
      setForms(response.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEditForm = (form) => {
    // Skip editing for the virtual faculty availability form
    if (form.id === 'faculty-availability') {
      return;
    }
    
    setEditingForm(form);
    setFormData({
      title: form.title,
      description: form.description,
      form_fields: form.form_fields || [],
      assigned_to_ids: form.assigned_to ? form.assigned_to.map(user => user.id) : [],
      is_active: form.is_active,
    });
    setOpenDialog(true);
  };

  const handleDeleteForm = async (formId) => {
    // Skip deletion for the virtual faculty availability form
    if (formId === 'faculty-availability') {
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await api.delete(`/forms/${formId}/`);
        fetchForms();
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    }
  };

  const handleSendFormLink = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      // Send emails to each selected user
      const emailPromises = selectedUsers.map(user => 
        usersAPI.sendFormLink(selectedForm.id, user.email, message)
      );

      await Promise.all(emailPromises);

      setSuccess(`Form link sent successfully to ${selectedUsers.length} user(s)!`);
      setSelectedUsers([]);
      setMessage('');
      setTimeout(() => {
        setOpenSendLinkDialog(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending form link:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      setError(err.response?.data?.error || 'Failed to send form link');
    }
  };

  const handleToggleUser = (user) => {
    const currentIndex = selectedUsers.findIndex(u => u.id === user.id);
    const newSelectedUsers = [...selectedUsers];

    if (currentIndex === -1) {
      newSelectedUsers.push(user);
    } else {
      newSelectedUsers.splice(currentIndex, 1);
    }

    setSelectedUsers(newSelectedUsers);
  };

  const handleOpenSendLinkDialog = (form) => {
    setSelectedForm(form);
    // Prepopulate the message with a template
    setMessage(`Hello,

You have been invited to complete the form "${form.title}".

Please click the link below to access the form. You will need to sign in with your Google account to proceed.

Best regards,
${currentUser?.first_name} ${currentUser?.last_name}  
${currentUser?.email}`);
    setOpenSendLinkDialog(true);
  };

  const handleViewSubmissions = (form) => {
    setSelectedFormForSubmissions(form);
    setSubmissionsDialogOpen(true);
  };

  const handleCloseSubmissionsDialog = () => {
    setSubmissionsDialogOpen(false);
    setSelectedFormForSubmissions(null);
  };

  const handleAddField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
      help_text: '',
      options: []
    };
    setFormData(prev => ({
      ...prev,
      form_fields: [...prev.form_fields, newField]
    }));
  };

  const handleFieldChange = (fieldId, field, value) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(f => 
        f.id === fieldId ? { ...f, [field]: value } : f
      )
    }));
  };

  const handleAddOption = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(field => 
        field.id === fieldId
          ? { ...field, options: [...field.options, { id: `option_${Date.now()}`, label: '' }] }
          : field
      )
    }));
  };

  const handleOptionChange = (fieldId, optionId, value) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(field => 
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map(opt =>
                opt.id === optionId ? { ...opt, label: value } : opt
              )
            }
          : field
      )
    }));
  };

  const handleDeleteOption = (fieldId, optionId) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(field => 
        field.id === fieldId
          ? { ...field, options: field.options.filter(opt => opt.id !== optionId) }
          : field
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form data
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    // Ensure form_fields array exists
    if (!formData.form_fields) {
      formData.form_fields = [];
    }

    // Validate each field
    for (const field of formData.form_fields) {
      if (!field.label) {
        setError('All fields must have a label');
        return;
      }
      if (!field.type) {
        setError('All fields must have a type');
        return;
      }
      if (['select', 'radio', 'checkbox'].includes(field.type) && (!field.options || field.options.length === 0)) {
        setError(`${field.label} must have at least one option`);
        return;
      }
    }

    try {
      if (editingForm) {
        await api.put(`/forms/${editingForm.id}/`, formData);
        setSuccess('Form updated successfully');
      } else {
        await api.post('/forms/', formData);
        setSuccess('Form created successfully');
      }
      setOpenDialog(false);
      fetchForms();
    } catch (err) {
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Failed to save form';
      setError(errorMessage);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await seasonsAPI.getSeasons();
      const currentDate = new Date();
      const activeSeasons = response.data.filter(season => 
        parseISO(season.end_date) >= currentDate
      );
      setSeasons(activeSeasons);
    } catch (err) {
      console.error('Error fetching seasons:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load seasons',
        severity: 'error'
      });
    }
  };

  const fetchCandidateSections = async (seasonId) => {
    try {
      const response = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(response.data);
      setSelectedSeason(seasonId);
    } catch (err) {
      console.error('Error fetching candidate sections:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load candidates',
        severity: 'error'
      });
    }
  };

  const fetchFacultyUsers = async () => {
    try {
      const response = await api.get('/users/?user_type=faculty');
      setFacultyUsers(response.data);
    } catch (err) {
      console.error('Error fetching faculty users:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load faculty users',
        severity: 'error'
      });
    }
  };

  const handleOpenInviteDialog = async () => {
    await fetchSeasons();
    await fetchFacultyUsers();
    setSelectedCandidates([]);
    setSelectedFaculty([]);
    setSelectedSeason(null);
    setCandidateSections([]);
    setShowInviteDialog(true);
  };

  const handleCloseInviteDialog = () => {
    setShowInviteDialog(false);
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleSelectFaculty = (facultyId) => {
    setSelectedFaculty(prev => {
      if (prev.includes(facultyId)) {
        return prev.filter(id => id !== facultyId);
      } else {
        return [...prev, facultyId];
      }
    });
  };

  const handleSendInvitations = async () => {
    if (selectedCandidates.length === 0 || selectedFaculty.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one candidate and one faculty member',
        severity: 'error'
      });
      return;
    }
    
    try {
      setSendingInvitations(true);
      
      // Add console logging to debug the request
      console.log("Sending invitation request with data:", {
        faculty_ids: selectedFaculty,
        candidate_section_ids: selectedCandidates,
        send_email: true
      });
      
      const response = await availabilityInvitationAPI.inviteFaculty(
        selectedFaculty,
        selectedCandidates,
        true
      );
      
      console.log("Invitation response:", response);
      
      setSnackbar({
        open: true,
        message: `Successfully sent invitations: ${response.data.message}`,
        severity: 'success'
      });
      
      handleCloseInviteDialog();
    } catch (err) {
      console.error('Error sending invitations:', err);
      console.error('Error details:', err.response?.data);
      setSnackbar({
        open: true,
        message: 'Failed to send invitations: ' + (err.response?.data?.error || err.message),
        severity: 'error'
      });
    } finally {
      setSendingInvitations(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleImportPreferredFaculty = async (candidateId) => {
    try {
      // Find the selected candidate section
      const selectedSection = candidateSections.find(section => section.id === candidateId);
      
      if (!selectedSection || !selectedSection.candidate || !selectedSection.candidate.id) {
        console.error('Cannot find candidate data for importing preferred faculty');
        return;
      }
      
      // Find the full candidate user object with profile data
      const candidateResponse = await usersAPI.getUser(selectedSection.candidate.id);
      const candidateWithProfile = candidateResponse.data;
      
      if (!candidateWithProfile || !candidateWithProfile.candidate_profile || 
          !candidateWithProfile.candidate_profile.preferred_faculty) {
        setSnackbar({
          open: true,
          message: 'This candidate has not provided any preferred faculty members.',
          severity: 'info'
        });
        return;
      }
      
      // Get the preferred faculty IDs from the candidate profile
      const preferredFacultyIds = candidateWithProfile.candidate_profile.preferred_faculty;
      
      if (!Array.isArray(preferredFacultyIds) || preferredFacultyIds.length === 0) {
        setSnackbar({
          open: true,
          message: 'This candidate has not selected any preferred faculty members.',
          severity: 'info'
        });
        return;
      }
      
      // Auto-select these faculty members
      const validFacultyIds = preferredFacultyIds.filter(id => 
        // Ensure the ID is in the facultyUsers list
        facultyUsers.some(faculty => faculty.id === id)
      );
      
      if (validFacultyIds.length === 0) {
        setSnackbar({
          open: true,
          message: 'None of the candidate\'s preferred faculty members are available in the system.',
          severity: 'warning'
        });
        return;
      }
      
      // Add the valid faculty IDs to the selected faculty list (avoiding duplicates)
      setSelectedFaculty(prev => {
        const newSelection = [...prev];
        validFacultyIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
      
      setSnackbar({
        open: true,
        message: `Imported ${validFacultyIds.length} preferred faculty member(s) for this candidate.`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error importing preferred faculty:', error);
      setSnackbar({
        open: true,
        message: 'Failed to import preferred faculty members. Please try again.',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600} color="primary.dark">
          Form Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => {
            setEditingForm(null);
            setFormData({
              title: '',
              description: '',
              form_fields: [],
              assigned_to_ids: [],
              is_active: true,
            });
            setOpenDialog(true);
          }}
          sx={{ 
            textTransform: 'none',
            borderRadius: 2,
            py: 1,
            px: 2,
            fontWeight: 500
          }}
        >
          Create Form
        </Button>
      </Box>

      {forms.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Forms Available
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create your first form using the "Create Form" button.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {forms.map(form => (
            <Grid item xs={12} md={6} key={form.id}>
              <Card 
                elevation={2} 
                sx={{ 
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  border: form.isVirtual ? `1px solid ${theme.palette.secondary.main}` : 'none',
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ 
                  bgcolor: form.isVirtual 
                    ? alpha(theme.palette.secondary.main, 0.08)
                    : alpha(theme.palette.primary.main, 0.05),
                  px: 3,
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="h6" fontWeight={600} color={form.isVirtual ? 'secondary.dark' : 'primary.dark'}>
                    {form.title}
                  </Typography>
                  {!form.is_active && !form.isVirtual && (
                    <Chip 
                      label="Inactive" 
                      size="small" 
                      color="error" 
                      sx={{ mt: 1, borderRadius: 1 }}
                    />
                  )}
                </Box>
                
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {form.description || "No description available."}
                  </Typography>
                  
                  {!form.isVirtual && (
                    <Box sx={{ mt: 2 }}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight={600} 
                        color="primary.dark" 
                        gutterBottom
                      >
                        Form Details:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {form.form_fields?.length || 0} field(s)
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                  {form.isVirtual ? (
                    <>
                      <Button 
                        startIcon={<VisibilityIcon />} 
                        onClick={() => handleViewSubmissions(form)}
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        View Submissions
                      </Button>
                      <Button 
                        startIcon={<PersonAddIcon />} 
                        onClick={handleOpenInviteDialog}
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Invite Faculty
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        startIcon={<EditIcon />} 
                        onClick={() => handleEditForm(form)}
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        startIcon={<VisibilityIcon />} 
                        onClick={() => handleViewSubmissions(form)}
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        View Submissions
                      </Button>
                      <Button 
                        startIcon={<EmailIcon />} 
                        onClick={() => handleOpenSendLinkDialog(form)}
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Send Link
                      </Button>
                      <Button 
                        startIcon={<DeleteIcon />} 
                        color="error"
                        onClick={() => handleDeleteForm(form.id)}
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingForm ? 'Edit Form' : 'Create New Form'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.value })
                }
                label="Status"
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
            
            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => option.email}
              value={users.filter(user => formData.assigned_to_ids.includes(user.id))}
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  assigned_to_ids: newValue.map(user => user.id),
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign To Users"
                  margin="normal"
                />
              )}
              sx={{ mt: 2 }}
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Form Fields
            </Typography>
            
            {formData.form_fields.map((field) => (
              <Paper key={field.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Field Label"
                      value={field.label}
                      onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Field Type</InputLabel>
                      <Select
                        value={field.type}
                        onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                        label="Field Type"
                      >
                        {FIELD_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Help Text"
                      value={field.help_text}
                      onChange={(e) => handleFieldChange(field.id, 'help_text', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.required}
                          onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                        />
                      }
                      label="Required"
                    />
                  </Grid>
                  
                  {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Options
                      </Typography>
                      {field.options.map((option) => (
                        <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={option.label}
                            onChange={(e) => handleOptionChange(field.id, option.id, e.target.value)}
                            placeholder="Option label"
                          />
                          <IconButton
                            onClick={() => handleDeleteOption(field.id, option.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOption(field.id)}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddField}
              sx={{ mb: 2 }}
            >
              Add Field
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingForm ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Form Link Dialog */}
      <Dialog open={openSendLinkDialog} onClose={() => setOpenSendLinkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Form Link to Users</DialogTitle>
        <form onSubmit={handleSendFormLink}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Form: <strong>{selectedForm?.title}</strong>
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select Users:
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <List>
                {users.map((user) => (
                  <ListItem 
                    button 
                    onClick={() => handleToggleUser(user)}
                    selected={selectedUsers.some(u => u.id === user.id)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedUsers.some(u => u.id === user.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={user.full_name || user.email} 
                      secondary={user.email}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Users ({selectedUsers.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsers.map((user) => (
                  <Chip 
                    key={user.id} 
                    label={user.full_name || user.email} 
                    onDelete={() => handleToggleUser(user)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a personalized message for the users..."
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSendLinkDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={selectedUsers.length === 0}
            >
              Send Link to {selectedUsers.length} User(s)
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog
        open={submissionsDialogOpen}
        onClose={handleCloseSubmissionsDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedFormForSubmissions?.title} - Submissions
        </DialogTitle>
        <DialogContent>
          {selectedFormForSubmissions?.id === 'faculty-availability' ? (
            <FacultyAvailabilitySubmissions />
          ) : (
            <FormSubmissions formId={selectedFormForSubmissions?.id} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubmissionsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={showInviteDialog}
        onClose={handleCloseInviteDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Invite Faculty for Availability</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph sx={{ mt: 1 }}>
            Select candidates and faculty members to invite for availability submissions.
          </Typography>
          
          {/* Season Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Season</InputLabel>
            <Select
              value={selectedSeason || ''}
              onChange={(e) => fetchCandidateSections(e.target.value)}
              label="Select Season"
            >
              {seasons.map((season) => (
                <MenuItem key={season.id} value={season.id}>
                  {season.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Candidate Selection with Import buttons */}
          {candidateSections.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Candidates:
              </Typography>
              <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {candidateSections.map((section) => (
                    <ListItem 
                      key={section.id} 
                      secondaryAction={
                        <Button
                          size="small"
                          startIcon={<ImportIcon fontSize="small" />}
                          onClick={() => handleImportPreferredFaculty(section.id)}
                          title="Import Preferred Faculty Selections"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Import Selections
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <Checkbox 
                          edge="start"
                          checked={selectedCandidates.includes(section.id)}
                          onClick={() => handleSelectCandidate(section.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${section.candidate.first_name} ${section.candidate.last_name}`}
                        secondary={
                          section.arrival_date && section.leaving_date 
                            ? `Visit: ${format(parseISO(section.arrival_date), 'MMM d')} - ${format(parseISO(section.leaving_date), 'MMM d')}`
                            : 'No visit dates specified'
                        }
                        onClick={() => handleSelectCandidate(section.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
          
          {/* Faculty Selection */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Faculty:
            </Typography>
            <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
              <List dense>
                {facultyUsers.map((user) => (
                  <ListItem key={user.id} button onClick={() => handleSelectFaculty(user.id)}>
                    <Checkbox 
                      edge="start"
                      checked={selectedFaculty.includes(user.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText 
                      primary={`${user.first_name} ${user.last_name}`}
                      secondary={user.email}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog} disabled={sendingInvitations}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvitations} 
            variant="contained" 
            color="primary"
            disabled={sendingInvitations || selectedCandidates.length === 0 || selectedFaculty.length === 0}
          >
            {sendingInvitations ? <CircularProgress size={24} /> : 'Send Invitations'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormManagement; 