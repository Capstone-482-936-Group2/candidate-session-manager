import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { usersAPI } from '../../api/api';

const RoomSetupDialog = ({ open, currentRoomNumber, onComplete }) => {
  const [roomNumber, setRoomNumber] = useState(currentRoomNumber || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset room number when dialog opens with new currentRoomNumber
  React.useEffect(() => {
    if (open) {
      setRoomNumber(currentRoomNumber || '');
      setError('');
    }
  }, [open, currentRoomNumber]);

  const handleSubmit = async () => {
    if (!roomNumber.trim()) {
      setError('Room number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await usersAPI.completeRoomSetup(roomNumber);
      onComplete(roomNumber);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <DialogTitle>Welcome! Please Set Up Your Room Number</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          As a faculty member, we need your room or office number for scheduling purposes.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Room/Office Number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          margin="normal"
          required
          error={!!error}
          disabled={loading}
          placeholder="e.g., PETR 123"
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !roomNumber.trim()}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomSetupDialog;
