import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import FormSubmission from './FormSubmission';
import api from '../../api/api';

const FormSubmissionPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const response = await api.get(`/forms/${formId}/`);
      setForm(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load form');
      console.error('Error loading form:', err);
      setLoading(false);
    }
  };

  const handleFormSubmitted = () => {
    // Redirect to the forms page after successful submission
    navigate('/forms');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Form not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {form.title}
        </Typography>
        {form.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {form.description}
          </Typography>
        )}
        <FormSubmission
          formId={formId}
          onSubmitted={handleFormSubmitted}
        />
      </Paper>
    </Box>
  );
};

export default FormSubmissionPage; 