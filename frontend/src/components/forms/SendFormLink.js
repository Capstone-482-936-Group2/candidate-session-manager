/**
 * Dialog component for sending form links to candidates via email.
 * Allows selection of forms, entering candidate email, and adding custom messages.
 * Provides feedback on success or error after submission.
 */
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

/**
 * SendFormLink component presents a dialog for sending form links to candidates.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback to close the dialog
 * @param {Array} props.forms - List of available forms with id and title
 * @returns {React.ReactNode} Dialog for sending form links
 */
const SendFormLink = ({ open, onClose, forms }) => {
  const [selectedForm, setSelectedForm] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Handles form submission to send the form link.
   * Shows success/error messages and resets form on success.
   * 
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await usersAPI.sendFormLink(selectedForm, candidateEmail, message);

      setSuccess('Form link sent successfully!');
      // Reset form fields
      setSelectedForm('');
      setCandidateEmail('');
      setMessage('');
      // Close dialog after success (with delay for user to see success message)
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send form link');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Form Link to Candidate</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* Display error/success messages */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          {/* Form selection dropdown */}
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

          {/* Candidate email input */}
          <TextField
            fullWidth
            label="Candidate Email"
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          {/* Custom message input */}
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