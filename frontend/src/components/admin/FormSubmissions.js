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
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import api from '../../api/api';

/**
 * Component to display all submissions for a specific form.
 * Shows submission details in a table format with field values and metadata.
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.formId - ID of the form to show submissions for
 */
const FormSubmissions = ({ formId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  /**
   * Formats a date range value for display in the submissions table
   * 
   * @param {Object|string} value - Date range value to format
   * @returns {string} Formatted date range string
   */
  const formatDateRange = (value) => {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    if (!value.startDate || !value.endDate) return '-';
    return `${new Date(value.startDate + 'T00:00:00').toLocaleDateString()} - ${new Date(value.endDate + 'T00:00:00').toLocaleDateString()}`;
  };

  /**
   * Formats an answer based on the field type for display in the submissions table
   * 
   * @param {Object} field - Form field definition
   * @param {any} value - Answer value to format
   * @returns {string} Formatted answer value
   */
  const formatAnswer = (field, value) => {
    if (!value) return '-';
    
    switch (field.type) {
      case 'date_range':
        return formatDateRange(value);
      case 'checkbox':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'date':
        return value ? new Date(value + 'T00:00:00').toLocaleDateString() : '-';
      default:
        return value;
    }
  };

  /**
   * Fetch form details and submissions when formId changes
   */
  useEffect(() => {
    fetchForm();
    fetchSubmissions();
  }, [formId]);

  /**
   * Fetches the form definition from the API
   */
  const fetchForm = async () => {
    try {
      const response = await api.get(`/forms/${formId}/`);
      setForm(response.data);
    } catch (err) {
      setError('Failed to load form details');
    }
  };

  /**
   * Fetches all submissions for the current form from the API
   */
  const fetchSubmissions = async () => {
    try {
      const response = await api.get(`/form-submissions/?form=${formId}`);
      setSubmissions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load submissions');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Form not found
      </Alert>
    );
  }

  // Get all field labels for the table header
  const fieldLabels = form.form_fields.map(field => field.label);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Form Submissions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {submissions.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center">
          No submissions yet
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Submitted By</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Status</TableCell>
                {fieldLabels.map((label, index) => (
                  <TableCell key={index}>
                    <Tooltip title={form.form_fields[index].help_text || ''}>
                      <span>{label}</span>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.submitted_by.email}</TableCell>
                  <TableCell>
                    {new Date(submission.submitted_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={submission.is_completed ? 'Completed' : 'In Progress'}
                      color={submission.is_completed ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  {form.form_fields.map((field) => (
                    <TableCell key={field.id}>
                      {formatAnswer(field, submission.answers[field.id])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FormSubmissions; 