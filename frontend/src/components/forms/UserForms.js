import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility as VisibilityIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FormSubmission from './FormSubmission';
import api from '../../api/api';

const UserForms = () => {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [selectedForm, setSelectedForm] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await api.get('/forms/');
      setForms(response.data);
      
      // Fetch submissions for each form
      const submissionsData = {};
      for (const form of response.data) {
        try {
          const submissionResponse = await api.get(`/form-submissions/?form=${form.id}`);
          // Only consider completed submissions
          const completedSubmission = submissionResponse.data.find(sub => sub.is_completed);
          submissionsData[form.id] = completedSubmission || null;
        } catch (err) {
          console.error(`Error fetching submissions for form ${form.id}:`, err);
        }
      }
      setSubmissions(submissionsData);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view these forms');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setError('Failed to load forms');
        console.error('Error loading forms:', err);
      }
    }
  };

  const handleViewForm = (form) => {
    if (submissions[form.id]) {
      // If the form has been submitted, show it in a dialog
      setSelectedForm(form);
    } else {
      // If the form hasn't been submitted, navigate to the form page
      navigate(`/forms/${form.id}`);
    }
  };

  const handleCloseDialog = () => {
    setSelectedForm(null);
  };

  const handleFormSubmitted = async () => {
    handleCloseDialog();
    
    // Only fetch the submission for the submitted form
    try {
      const submissionResponse = await api.get(`/form-submissions/?form=${selectedForm.id}`);
      // Only consider completed submissions
      const completedSubmission = submissionResponse.data.find(sub => sub.is_completed);
      setSubmissions(prev => ({
        ...prev,
        [selectedForm.id]: completedSubmission || null
      }));
    } catch (err) {
      console.error(`Error fetching submission for form ${selectedForm.id}:`, err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        My Forms
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms.map((form) => (
              <TableRow key={form.id}>
                <TableCell>{form.title}</TableCell>
                <TableCell>{form.description}</TableCell>
                <TableCell>
                  <Chip
                    label={submissions[form.id] ? 'Submitted' : 'Not Submitted'}
                    color={submissions[form.id] ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {submissions[form.id] ? (
                    <Tooltip title="View Submission">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewForm(form)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleViewForm(form)}
                    >
                      Fill Out
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={!!selectedForm}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedForm?.title}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedForm && (
            <FormSubmission
              formId={selectedForm.id}
              onClose={handleCloseDialog}
              onSubmitted={handleFormSubmitted}
              isViewOnly={!!submissions[selectedForm.id]}
              submission={submissions[selectedForm.id]}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UserForms; 