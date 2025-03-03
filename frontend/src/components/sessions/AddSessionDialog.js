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

const AddSessionDialog = ({ open, onClose, onSubmit }) => {
  const [sessionData, setSessionData] = useState({
    title: `Session Request - ${new Date().toLocaleDateString()}`,
    description: '',
    location: '',
    start_time: new Date(),
    end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
    needs_transportation: false
  });

  const handleChange = (field) => (event) => {
    setSessionData({
      ...sessionData,
      [field]: event.target.value
    });
  };

  const handleDateChange = (field) => (newValue) => {
    setSessionData({
      ...sessionData,
      [field]: newValue
    });
  };

  const handleSubmit = () => {
    onSubmit(sessionData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule Your Session</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Description"
            multiline
            rows={4}
            value={sessionData.description}
            onChange={handleChange('description')}
            placeholder="Please provide any additional information about your session"
          />
          
          <TextField
            label="Location"
            value={sessionData.location}
            onChange={handleChange('location')}
            placeholder="Enter the location for your session"
          />
          
          <DateTimePicker
            label="Start Time"
            value={sessionData.start_time}
            onChange={handleDateChange('start_time')}
            sx={{ width: '100%' }}
          />
          
          <DateTimePicker
            label="End Time"
            value={sessionData.end_time}
            onChange={handleDateChange('end_time')}
            sx={{ width: '100%' }}
          />
          
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