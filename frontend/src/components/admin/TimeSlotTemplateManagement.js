import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, FormControlLabel, Switch, IconButton, Divider,
  FormControl, InputLabel, Select, MenuItem, Autocomplete, CircularProgress, Paper
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { timeSlotTemplatesAPI, locationTypesAPI, locationsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme, alpha } from '@mui/material/styles';

/**
 * Component for managing time slot templates.
 * Allows administrators to create, edit, and delete templates that can be used
 * to quickly set up recurring time slots for candidate visits.
 */
const TimeSlotTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    start_time: null,
    duration_minutes: 60,
    max_attendees: 1,
    use_location_type: false,
    custom_location: '',
    location: null,
    location_type: null,
    notes: '',
    is_visible: true,
    has_end_time: true
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { currentUser } = useAuth();
  const [locationTypes, setLocationTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const theme = useTheme();

  /**
   * Fetch templates, location types, and locations on component mount
   */
  useEffect(() => {
    fetchTemplates();
    fetchLocationTypes();
    fetchLocations();
  }, []);

  /**
   * Fetches all time slot templates from the API
   */
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await timeSlotTemplatesAPI.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to load templates',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches all location types from the API
   */
  const fetchLocationTypes = async () => {
    try {
      const response = await locationTypesAPI.getLocationTypes();
      setLocationTypes(response.data);
    } catch (err) {
      // Handle error silently to not disrupt the main UI flow
    }
  };

  /**
   * Fetches all locations from the API
   */
  const fetchLocations = async () => {
    try {
      const response = await locationsAPI.getLocations();
      setLocations(response.data);
    } catch (err) {
      // Handle error silently to not disrupt the main UI flow
    }
  };

  /**
   * Opens the dialog for creating a new template
   */
  const handleOpenDialog = () => {
    setTemplateForm({
      name: '',
      description: '',
      start_time: null,
      duration_minutes: 60,
      max_attendees: 1,
      use_location_type: false,
      custom_location: '',
      location: null,
      location_type: null,
      notes: '',
      is_visible: true,
      has_end_time: true
    });
    setDialogOpen(true);
  };

  /**
   * Closes the create template dialog
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  /**
   * Opens the dialog for editing an existing template
   * @param {Object} template - The template to edit
   */
  const handleOpenEditDialog = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      start_time: template.start_time ? new Date(`2000-01-01T${template.start_time}`) : null,
      duration_minutes: template.duration_minutes,
      max_attendees: template.max_attendees,
      use_location_type: template.use_location_type,
      custom_location: template.custom_location || '',
      location: template.location,
      location_type: template.location_type,
      notes: template.notes || '',
      is_visible: template.is_visible,
      has_end_time: template.has_end_time
    });
    setEditDialogOpen(true);
  };

  /**
   * Closes the edit template dialog
   */
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTemplate(null);
  };

  /**
   * Handles changes to form fields
   * @param {Object} e - The event object
   */
  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'use_location_type') {
      setTemplateForm(prev => ({
        ...prev,
        use_location_type: checked,
        location: null,
        location_type: checked ? (locationTypes.length > 0 ? locationTypes[0].id : null) : null,
        custom_location: ''
      }));
      
      if (checked && locationTypes.length > 0) {
        const typeId = locationTypes[0].id;
        const filtered = locations.filter(loc => loc.location_type === typeId);
        setFilteredLocations(filtered);
      }
    } else if (name === 'location_type') {
      setTemplateForm(prev => ({
        ...prev,
        location_type: value,
        location: null
      }));
      
      const filtered = locations.filter(loc => loc.location_type === value);
      setFilteredLocations(filtered);
    } else if (name === 'has_end_time') {
      setTemplateForm(prev => ({
        ...prev,
        has_end_time: checked,
        is_visible: checked ? prev.is_visible : false
      }));
    } else if (name === 'is_visible') {
      setTemplateForm(prev => ({
        ...prev,
        is_visible: prev.has_end_time ? checked : false
      }));
    } else {
      setTemplateForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Handles changes to date or time fields
   * @param {string} field - The field name
   * @param {Date} value - The new date/time value
   */
  const handleDateTimeChange = (field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handles changes to the location field
   * @param {Object} event - The event object
   * @param {Object|string} newValue - The selected location or custom location string
   */
  const handleLocationChange = (event, newValue) => {
    if (typeof newValue === 'string') {
      setTemplateForm(prev => ({
        ...prev,
        custom_location: newValue,
        location: null
      }));
    } else if (newValue && newValue.id) {
      setTemplateForm(prev => ({
        ...prev,
        location: newValue.id,
        custom_location: ''
      }));
    } else {
      setTemplateForm(prev => ({
        ...prev,
        location: null,
        custom_location: ''
      }));
    }
  };

  /**
   * Creates a new template with the current form data
   */
  const handleCreateTemplate = async () => {
    try {
      let timeString = null;
      if (templateForm.start_time) {
        const time = new Date(templateForm.start_time);
        timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      }
      
      const formData = {
        ...templateForm,
        start_time: timeString
      };
      
      await timeSlotTemplatesAPI.createTemplate(formData);
      fetchTemplates();
      setDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Template created successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to create template',
        severity: 'error'
      });
    }
  };

  /**
   * Updates an existing template with the current form data
   */
  const handleUpdateTemplate = async () => {
    try {
      let timeString = null;
      if (templateForm.start_time) {
        const time = new Date(templateForm.start_time);
        timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      }
      
      const formData = {
        ...templateForm,
        start_time: timeString
      };
      
      await timeSlotTemplatesAPI.updateTemplate(selectedTemplate.id, formData);
      fetchTemplates();
      setEditDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Template updated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update template',
        severity: 'error'
      });
    }
  };

  /**
   * Deletes a template by ID
   * @param {number} templateId - The ID of the template to delete
   */
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      await timeSlotTemplatesAPI.deleteTemplate(templateId);
      fetchTemplates();
      setSnackbar({
        open: true,
        message: 'Template deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete template',
        severity: 'error'
      });
    }
  };

  /**
   * Closes the snackbar notification
   */
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600} color="primary.dark">
          Time Slot Templates
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
          sx={{ 
            textTransform: 'none',
            borderRadius: 2,
            py: 1,
            px: 2,
            fontWeight: 500
          }}
        >
          Add Template
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
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
            No Templates Available
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create your first time slot template using the "Add Template" button.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {templates.map(template => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card 
                elevation={2} 
                sx={{ 
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  px: 3,
                  py: 2
                }}>
                  <Typography variant="h6" fontWeight={600}>
                    {template.name}
                  </Typography>
                </Box>
                
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {template.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      color="primary.dark" 
                      gutterBottom
                    >
                      Details:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Start Time:</strong> {template.start_time ? template.start_time : 'Not set'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Duration:</strong> {template.duration_minutes} minutes
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Max Attendees:</strong> {template.max_attendees}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Visible:</strong> {template.is_visible ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      color="primary.dark" 
                      gutterBottom
                    >
                      Location:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.use_location_type
                        ? `Location Type: ${locationTypes.find(t => t.id === template.location_type)?.name || 'Unknown'}`
                        : template.custom_location
                          ? `Custom: ${template.custom_location}`
                          : template.location
                            ? `Location: ${locations.find(l => l.id === template.location)?.name || 'Unknown'}`
                            : 'No location specified'}
                    </Typography>
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    startIcon={<EditIcon />} 
                    onClick={() => handleOpenEditDialog(template)}
                    sx={{ 
                      textTransform: 'none',
                      borderRadius: 1.5,
                      fontWeight: 500
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    startIcon={<DeleteIcon />} 
                    color="error"
                    onClick={() => handleDeleteTemplate(template.id)}
                    sx={{ 
                      ml: 1,
                      textTransform: 'none',
                      borderRadius: 1.5,
                      fontWeight: 500
                    }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Template Name"
                value={templateForm.name}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={templateForm.description}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimePicker
                label="Default Start Time (optional)"
                value={templateForm.start_time}
                onChange={(newValue) => handleDateTimeChange('start_time', newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                timezone="local"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="duration_minutes"
                label="Duration (minutes)"
                type="number"
                value={templateForm.duration_minutes}
                onChange={handleFormChange}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="max_attendees"
                label="Max Attendees"
                type="number"
                value={templateForm.max_attendees}
                onChange={handleFormChange}
                fullWidth
                required
                inputProps={{ min: 0 }}
                disabled={!templateForm.has_end_time}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="use_location_type"
                    checked={templateForm.use_location_type}
                    onChange={handleFormChange}
                  />
                }
                label="Use Location Type (instead of specific location)"
              />
            </Grid>
            {templateForm.use_location_type ? (
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Location Type</InputLabel>
                  <Select
                    name="location_type"
                    value={templateForm.location_type || ''}
                    onChange={handleFormChange}
                    label="Location Type"
                  >
                    {locationTypes.map(type => (
                      <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Autocomplete
                  sx={{ mt: 2 }}
                  options={locations}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (option && option.name) return option.name;
                    return '';
                  }}
                  value={locations.find(loc => loc.id === templateForm.location) || null}
                  onChange={handleLocationChange}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Location"
                      fullWidth
                      onChange={(e) => {
                        if (e.target.value) {
                          setTemplateForm(prev => ({
                            ...prev,
                            custom_location: e.target.value,
                            location: null
                          }));
                        }
                      }}
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={templateForm.notes}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="has_end_time"
                    checked={templateForm.has_end_time}
                    onChange={handleFormChange}
                  />
                }
                label="Has End Time"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_visible"
                    checked={templateForm.is_visible}
                    onChange={handleFormChange}
                    color="primary"
                    disabled={!templateForm.has_end_time}
                  />
                }
                label="Visible on Calendar"
              />
            </Grid>
            {!templateForm.has_end_time && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2 }}>
                Time slots without an end time are always hidden on the calendar
              </Typography>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateTemplate} 
            variant="contained"
            disabled={!templateForm.name || templateForm.duration_minutes < 1}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Template</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Template Name"
            value={templateForm.name}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            name="description"
            label="Description"
            value={templateForm.description}
            onChange={handleFormChange}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
          <Box sx={{ mb: 2, mt: 2 }}>
            <TimePicker
              label="Start Time (optional)"
              value={templateForm.start_time}
              onChange={(newValue) => handleDateTimeChange('start_time', newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                name="use_location_type"
                checked={templateForm.use_location_type}
                onChange={handleFormChange}
              />
            }
            label="Use Location Type (instead of specific location)"
          />
          
          {templateForm.use_location_type ? (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Location Type</InputLabel>
                <Select
                  name="location_type"
                  value={templateForm.location_type || ''}
                  onChange={handleFormChange}
                  label="Location Type"
                >
                  {locationTypes.map(type => (
                    <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <Autocomplete
              sx={{ mt: 2 }}
              options={locations}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                if (option && option.name) return option.name;
                return '';
              }}
              value={locations.find(loc => loc.id === templateForm.location) || null}
              onChange={handleLocationChange}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location"
                  fullWidth
                  onChange={(e) => {
                    if (e.target.value) {
                      setTemplateForm(prev => ({
                        ...prev,
                        custom_location: e.target.value,
                        location: null
                      }));
                    }
                  }}
                />
              )}
            />
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                name="duration_minutes"
                label="Duration (minutes)"
                type="number"
                value={templateForm.duration_minutes}
                onChange={handleFormChange}
                fullWidth
                inputProps={{ min: 15 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="max_attendees"
                label="Max Attendees"
                type="number"
                value={templateForm.max_attendees}
                onChange={handleFormChange}
                fullWidth
                inputProps={{ min: 1 }}
                disabled={!templateForm.has_end_time}
              />
            </Grid>
          </Grid>
          
          <TextField
            name="notes"
            label="Notes"
            value={templateForm.notes}
            onChange={handleFormChange}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
          
          <Box sx={{ display: 'flex', mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  name="has_end_time"
                  checked={templateForm.has_end_time}
                  onChange={handleFormChange}
                />
              }
              label="Has End Time"
            />
            
            <FormControlLabel
              control={
                <Switch
                  name="is_visible"
                  checked={templateForm.is_visible}
                  onChange={handleFormChange}
                  disabled={!templateForm.has_end_time}
                />
              }
              label="Visible"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateTemplate} color="primary" variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </Box>
  );
};

export default TimeSlotTemplateManagement;
