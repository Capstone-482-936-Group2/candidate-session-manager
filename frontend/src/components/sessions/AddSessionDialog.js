/**
 * Dialog component for scheduling new sessions.
 * Provides a form interface to collect session details including description,
 * location, start/end times, and transportation needs.
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

/**
 * AddSessionDialog component allows users to create new session requests
 * with customizable details.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls whether the dialog is visible
 * @param {Function} props.onClose - Handler function when dialog is closed
 * @param {Function} props.onSubmit - Handler function that receives the session data on submission
 * @returns {React.ReactNode} Dialog component for adding sessions
 */
const AddSessionDialog = ({ open, onClose, onSubmit }) => {
  /**
   * State for session data with default values
   */
  const [sessionData, setSessionData] = useState({
    title: `Session Request - ${new Date().toLocaleDateString()}`,
    description: '',
    location: '',
    start_time: new Date(),
    end_time: new Date(new Date().setHours(new Date().getHours() + 1)), // Default to 1 hour duration
    needs_transportation: false
  });

  /**
   * Handles text input changes for session fields
   * 
   * @param {string} field - Field name to update
   * @returns {Function} Event handler function
   */
  const handleChange = (field) => (event) => {
    setSessionData({
      ...sessionData,
      [field]: event.target.value
    });
  };

  /**
   * Handles date/time input changes for session fields
   * 
   * @param {string} field - Field name to update
   * @returns {Function} Date change handler function
   */
  const handleDateChange = (field) => (newValue) => {
    setSessionData({
      ...sessionData,
      [field]: newValue
    });
  };

  /**
   * Submits the session data to parent component and closes the dialog
   */
  const handleSubmit = () => {
    onSubmit(sessionData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule Your Session</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Description text field */}
          <TextField
            label="Description"
            multiline
            rows={4}
            value={sessionData.description}
            onChange={handleChange('description')}
            placeholder="Please provide any additional information about your session"
          />
          
          {/* Location text field */}
          <TextField
            label="Location"
            value={sessionData.location}
            onChange={handleChange('location')}
            placeholder="Enter the location for your session"
          />
          
          {/* Start time picker */}
          <DateTimePicker
            label="Start Time"
            value={sessionData.start_time}
            onChange={handleDateChange('start_time')}
            sx={{ width: '100%' }}
          />
          
          {/* End time picker */}
          <DateTimePicker
            label="End Time"
            value={sessionData.end_time}
            onChange={handleDateChange('end_time')}
            sx={{ width: '100%' }}
          />
          
          {/* Transportation needs checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={sessionData.needs_transportation}
                onChange={(e) => setSessionData({
                  ...sessionData,
                  needs_transportation: e.target.checked
                })}
              />
            }
            label="I need help arranging transportation"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Schedule Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSessionDialog; 