import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, FormControlLabel, Switch, IconButton, Divider,
  FormControl, InputLabel, Select, MenuItem, Autocomplete
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { timeSlotTemplatesAPI, locationTypesAPI, locationsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

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

  useEffect(() => {
    fetchTemplates();
    fetchLocationTypes();
    fetchLocations();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await timeSlotTemplatesAPI.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load templates',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationTypes = async () => {
    try {
      const response = await locationTypesAPI.getLocationTypes();
      setLocationTypes(response.data);
    } catch (err) {
      console.error('Error fetching location types:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await locationsAPI.getLocations();
      setLocations(response.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

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

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

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

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTemplate(null);
  };

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

  const handleDateTimeChange = (field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
      console.error('Error creating template:', err);
      setSnackbar({
        open: true,
        message: 'Failed to create template',
        severity: 'error'
      });
    }
  };

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
      console.error('Error updating template:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update template',
        severity: 'error'
      });
    }
  };

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
      console.error('Error deleting template:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete template',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Time Slot Templates</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Template
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading templates...</Typography>
      ) : (
        <Grid container spacing={3}>
          {templates.length > 0 ? (
            templates.map(template => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{template.name}</Typography>
                    {template.description && (
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    )}
                    
                    {template.has_end_time && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Duration: {template.duration_minutes} min
                        </Typography>
                        <Typography variant="body2">
                          Max Attendees: {template.max_attendees}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="body2">
                      Start Time: {template.start_time || 'Not set'}
                    </Typography>
                    <Typography variant="body2">
                      Has End Time: {template.has_end_time ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      Visible: {template.is_visible ? 'Yes' : 'No'}
                    </Typography>
                    {template.location && (
                      <Typography variant="body2">Location: {template.location}</Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEditDialog(template)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="h6" textAlign="center">
                No templates found. Create one to get started!
              </Typography>
            </Grid>
          )}
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
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TimeSlotTemplateManagement;
