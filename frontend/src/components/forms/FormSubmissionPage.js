/**
 * Page component for rendering a form submission interface.
 * Handles form loading, routing parameters, and navigation after submission.
 */
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

/**
 * FormSubmissionPage component renders a full page for form submission.
 * Fetches the form data based on the URL parameter and handles navigation after submission.
 * 
 * @returns {React.ReactNode} Form submission page
 */
const FormSubmissionPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  /**
   * Fetches form data when component mounts or formId changes
   */
  useEffect(() => {
    fetchForm();
  }, [formId]);

  /**
   * Fetches form data from the API using the formId from URL parameters
   */
  const fetchForm = async () => {
    try {
      const response = await api.get(`/forms/${formId}/`);
      setForm(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load form');
      setLoading(false);
    }
  };

  /**
   * Handles successful form submission by redirecting user to forms list page
   */
  const handleFormSubmitted = () => {
    // Redirect to the forms page after successful submission
    navigate('/forms');
  };

  // Show loading spinner while fetching form
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message if form loading failed
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Show error if form not found
  if (!form) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Form not found</Alert>
      </Box>
    );
  }

  // Render form with submission component
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