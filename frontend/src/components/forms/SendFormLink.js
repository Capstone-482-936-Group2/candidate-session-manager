import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import { usersAPI } from '../../api/api';

const SendFormLink = ({ open, onClose, forms }) => {
  const [selectedForm, setSelectedForm] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await usersAPI.sendFormLink(selectedForm, candidateEmail, message);

      setSuccess('Form link sent successfully!');
      setSelectedForm('');
      setCandidateEmail('');
      setMessage('');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error sending form link:', err);
      setError(err.response?.data?.error || 'Failed to send form link');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Form Link to Candidate</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Form</InputLabel>
            <Select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              label="Select Form"
              required
            >
              {forms.map((form) => (
                <MenuItem key={form.id} value={form.id}>
                  {form.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Candidate Email"
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a personalized message for the candidate..."
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Send Link
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SendFormLink; 