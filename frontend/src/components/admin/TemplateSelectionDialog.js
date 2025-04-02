import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  TextField,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { timeSlotTemplatesAPI, locationsAPI } from '../../api/api';

const TemplateSelectionDialog = ({ open, onClose, onSelectTemplate, onCustomOption }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [numberOfSlots, setNumberOfSlots] = useState(1);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [intervalDays, setIntervalDays] = useState(0);
  const [startDate, setStartDate] = useState(new Date());
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchLocations();
    }
  }, [open]);

  useEffect(() => {
    if (intervalDays > 0) {
      setIntervalMinutes(0);
    }
  }, [intervalDays]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await timeSlotTemplatesAPI.getTemplates();
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
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

  const handleSelectTemplate = () => {
    if (!selectedTemplateId) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onSelectTemplate(
        template, 
        numberOfSlots, 
        intervalMinutes, 
        intervalDays, 
        startDate, 
        selectedLocation
      );
    }
  };

  const handleCustomOption = () => {
    onCustomOption();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Time Slot Template</DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Loading templates...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : templates.length === 0 ? (
          <Typography>No templates found. Create a template first or use custom option.</Typography>
        ) : (
          <>
            {!selectedTemplateId ? (
              <List sx={{ mb: 3 }}>
                {templates.map((template) => (
                  <ListItem 
                    key={template.id}
                    button
                    selected={selectedTemplateId === template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={template.name}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {template.description}
                          </Typography>
                          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                            {template.has_end_time ? (
                              <>
                                Duration: {template.duration_minutes} min | 
                                Max Attendees: {template.max_attendees} | 
                              </>
                            ) : 'No End Time | '}
                            Visible: {template.is_visible ? 'Yes' : 'No'}
                          </Typography>
                          {template.location && (
                            <Typography variant="body2">Location: {template.location}</Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                <Typography variant="h6">{templates.find(t => t.id === selectedTemplateId)?.name}</Typography>
                <Typography variant="body2">{templates.find(t => t.id === selectedTemplateId)?.description}</Typography>
                <Button 
                  size="small" 
                  sx={{ mt: 1 }} 
                  onClick={() => setSelectedTemplateId(null)}
                >
                  Select Different Template
                </Button>
              </Box>
            )}

            {selectedTemplateId && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>Configure Time Slots</Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(newDate) => setStartDate(newDate)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <FormHelperText>Select the date for the first time slot</FormHelperText>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Number of Slots"
                      type="number"
                      fullWidth
                      value={numberOfSlots}
                      onChange={(e) => setNumberOfSlots(Math.max(1, parseInt(e.target.value) || 1))}
                      inputProps={{ min: 1 }}
                      helperText="How many time slots to create"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Days Between Slots"
                      type="number"
                      fullWidth
                      value={intervalDays}
                      onChange={(e) => {
                        const newDays = Math.max(0, parseInt(e.target.value) || 0);
                        setIntervalDays(newDays);
                        if (intervalDays === 0 && newDays > 0) {
                          setIntervalMinutes(0);
                        }
                      }}
                      inputProps={{ min: 0 }}
                      helperText="Days between consecutive slots"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Minutes Between Slots"
                      type="number"
                      fullWidth
                      value={intervalMinutes}
                      onChange={(e) => {
                        const minValue = intervalDays > 0 ? 0 : 15;
                        const enteredValue = parseInt(e.target.value);
                        setIntervalMinutes(isNaN(enteredValue) ? 60 : Math.max(minValue, enteredValue));
                      }}
                      inputProps={{ 
                        min: intervalDays > 0 ? 0 : 15,
                        step: 15 
                      }}
                      helperText={intervalDays > 0 ? "Additional minutes (can be 0)" : "Minimum 15 minutes"}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {selectedTemplateId && templates.find(t => t.id === selectedTemplateId)?.use_location_type && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Location</InputLabel>
                  <Select
                    value={selectedLocation || ''}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    label="Select Location"
                    required
                  >
                    {locations
                      .filter(loc => loc.location_type === templates.find(t => t.id === selectedTemplateId)?.location_type)
                      .map(location => (
                        <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>
                      ))
                    }
                  </Select>
                  <FormHelperText>
                    This template uses a location type. Please select a specific location.
                  </FormHelperText>
                </FormControl>
              </Box>
            )}
          </>
        )}
        
        <Divider sx={{ my: 2 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Button 
            onClick={handleCustomOption}
            color="secondary"
          >
            Or Create Custom Time Slot
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSelectTemplate} 
          color="primary" 
          variant="contained"
          disabled={!selectedTemplateId}
        >
          Use Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSelectionDialog;
