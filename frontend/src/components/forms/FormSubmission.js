/**
 * Form submission component that dynamically renders form fields based on configuration.
 * Handles both form submission mode and view-only mode for reviewing previous submissions.
 * Supports various field types including text, textarea, select, radio, checkbox, date, and date ranges.
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Checkbox,
  FormGroup,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Close as CloseIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import api from '../../api/api';

/**
 * Form submission component that dynamically renders form fields and handles submissions.
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.formId - ID of the form to load
 * @param {Function} props.onClose - Callback function when form is closed
 * @param {Function} props.onSubmitted - Callback function when form is successfully submitted
 * @param {boolean} props.isViewOnly - Whether the form should be in view-only mode
 * @param {Object} props.submission - Previous submission data (for view-only mode)
 * @returns {React.ReactNode} Form submission interface
 */
const FormSubmission = ({ formId, onClose, onSubmitted, isViewOnly = false, submission = null }) => {
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Formats a date range value for display
   * 
   * @param {Object|string} value - Date range value
   * @returns {string} Formatted date range
   */
  const formatDateRange = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (!value.startDate || !value.endDate) return '';
    return `${new Date(value.startDate + 'T00:00:00').toLocaleDateString()} - ${new Date(value.endDate + 'T00:00:00').toLocaleDateString()}`;
  };

  /**
   * Formats a field's answer for display based on field type
   * 
   * @param {Object} field - Field configuration
   * @param {any} value - Field value
   * @returns {string} Formatted answer
   */
  const formatAnswer = (field, value) => {
    if (!value) return '';
    
    switch (field.type) {
      case 'date_range':
        return formatDateRange(value);
      case 'checkbox':
        return Array.isArray(value) ? value.join(', ') : '';
      case 'date':
        return value ? new Date(value + 'T00:00:00').toLocaleDateString() : '';
      default:
        return value;
    }
  };

  /**
   * Formats a date string for display in date picker component
   * 
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {Date|null} Date object or null if invalid
   */
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return null;
    // Create a date object and set it to noon UTC to avoid timezone issues
    const date = new Date(dateString + 'T12:00:00Z');
    return date;
  };

  /**
   * Formats a date object for submission to API in YYYY-MM-DD format
   * 
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  const formatDateForSubmission = (date) => {
    if (!date) return '';
    // Format the date as YYYY-MM-DD in UTC
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Fetches form data from API when component mounts
   */
  useEffect(() => {
    fetchForm();
  }, [formId]);

  /**
   * Fetches form data and initializes answers
   */
  const fetchForm = async () => {
    try {
      const response = await api.get(`/forms/${formId}/`);
      setForm(response.data);
      
      // If in view-only mode and we have a submission, use its answers
      if (isViewOnly && submission) {
        // Ensure date range values are properly formatted
        const formattedAnswers = {};
        Object.entries(submission.answers).forEach(([fieldId, value]) => {
          const field = response.data.form_fields.find(f => f.id === parseInt(fieldId));
          if (field?.type === 'date_range' && value) {
            formattedAnswers[fieldId] = {
              startDate: value.startDate || '',
              endDate: value.endDate || ''
            };
          } else {
            formattedAnswers[fieldId] = value;
          }
        });
        setAnswers(formattedAnswers);
      } else {
        // Initialize answers object with empty values for each field
        const initialAnswers = {};
        response.data.form_fields.forEach((field) => {
          if (field.type === 'checkbox') {
            initialAnswers[field.id] = [];
          } else if (field.type === 'date_range') {
            initialAnswers[field.id] = { startDate: '', endDate: '' };
          } else {
            initialAnswers[field.id] = '';
          }
        });
        setAnswers(initialAnswers);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load form');
      console.error('Error loading form:', err);
      setLoading(false);
    }
  };

  /**
   * Updates a field's answer in state
   * 
   * @param {string|number} fieldId - Field ID
   * @param {any} value - New field value
   */
  const handleAnswerChange = (fieldId, value) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  /**
   * Handles checkbox field changes
   * 
   * @param {string|number} fieldId - Field ID
   * @param {string} optionLabel - Option label
   * @param {boolean} checked - Whether checkbox is checked
   */
  const handleCheckboxChange = (fieldId, optionLabel, checked) => {
    setAnswers(prev => {
      const currentAnswers = prev[fieldId] || [];
      const newAnswers = checked
        ? [...currentAnswers, optionLabel]
        : currentAnswers.filter(answer => answer !== optionLabel);
      return {
        ...prev,
        [fieldId]: newAnswers
      };
    });
  };

  /**
   * Validates all form answers before submission
   * 
   * @returns {Object} Validation errors by field ID
   */
  const validateAnswers = () => {
    const errors = {};
    form.form_fields.forEach(field => {
      if (field.required) {
        const answer = answers[field.id];
        if (!answer) {
          errors[field.id] = `${field.label} is required`;
        } else if (field.type === 'date_range') {
          if (!answer.startDate || !answer.endDate) {
            errors[field.id] = `Both start and end dates are required for ${field.label}`;
          } else if (new Date(answer.startDate) > new Date(answer.endDate)) {
            errors[field.id] = `Start date must be before end date for ${field.label}`;
          }
        }
      }
    });
    return errors;
  };

  /**
   * Handles initial submit button click
   * Validates form and opens confirmation dialog
   * 
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmitClick = (e) => {
    if (e) {
      e.preventDefault();
    }

    const validationErrors = validateAnswers();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setConfirmDialogOpen(true);
  };

  /**
   * Handles final form submission after confirmation
   * Sends form data to API
   */
  const handleConfirmSubmit = async () => {
    setConfirmDialogOpen(false);
    setSubmitting(true);

    try {
      // Format the answers to ensure field IDs are strings
      const formattedAnswers = {};
      Object.entries(answers).forEach(([fieldId, value]) => {
        formattedAnswers[String(fieldId)] = value;
      });

      const formData = {
        form: formId,
        answers: formattedAnswers,
        is_completed: true
      };
      
      console.log('Form fields:', form.form_fields);
      console.log('Answers before submission:', formattedAnswers);
      console.log('Submitting form data:', formData);
      const response = await api.post('/form-submissions/', formData);
      console.log('Submission response:', response.data);
      setSuccess('Form submitted successfully');
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      console.error('Form submission error:', error.response?.data || error);
      // Show more specific error message from the backend
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          error.response?.data?.answers || 
                          'Failed to submit form. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Renders field help text with HTML support
   * 
   * @param {string} helpText - Help text content
   * @returns {React.ReactNode} Rendered help text
   */
  const renderHelpText = (helpText) => {
    if (!helpText) return null;
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        dangerouslySetInnerHTML={{ __html: helpText }}
        sx={{ mt: 1 }}
      />
    );
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

  const renderField = (field) => {
    if (isViewOnly) {
      return (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {field.label}
            {field.required && <span style={{ color: 'red' }}> *</span>}
          </Typography>
          <Typography variant="body1">
            {formatAnswer(field, answers[field.id])}
          </Typography>
          {field.help_text && (
            <Typography variant="body2" color="text.secondary">
              {field.help_text}
            </Typography>
          )}
        </Box>
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={answers[field.id] || ''}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            required={field.required}
            helperText={field.help_text}
            error={field.required && !answers[field.id]}
            disabled={isViewOnly}
          />
        );
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={field.label}
              value={formatDateForDisplay(answers[field.id])}
              onChange={(newValue) => handleAnswerChange(field.id, formatDateForSubmission(newValue))}
              disabled={isViewOnly}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: field.required,
                  helperText: field.help_text,
                  error: field.required && !answers[field.id],
                }
              }}
            />
          </LocalizationProvider>
        );
      case 'date_range':
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {field.label}
              {field.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formatDateForDisplay(answers[field.id]?.startDate)}
                  onChange={(newValue) => {
                    const newAnswer = {
                      ...answers[field.id],
                      startDate: formatDateForSubmission(newValue)
                    };
                    handleAnswerChange(field.id, newAnswer);
                  }}
                  disabled={isViewOnly}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: field.required,
                      error: field.required && (!answers[field.id]?.startDate),
                    }
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={formatDateForDisplay(answers[field.id]?.endDate)}
                  onChange={(newValue) => {
                    const newAnswer = {
                      ...answers[field.id],
                      endDate: formatDateForSubmission(newValue)
                    };
                    handleAnswerChange(field.id, newAnswer);
                  }}
                  disabled={isViewOnly}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: field.required,
                      error: field.required && (!answers[field.id]?.endDate),
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>
            {field.help_text && (
              <FormHelperText error={field.required && (!answers[field.id]?.startDate || !answers[field.id]?.endDate)}>
                {field.help_text}
              </FormHelperText>
            )}
          </Box>
        );
      case 'textarea':
        return (
          <Box>
            <TextField
              fullWidth
              label={field.label}
              value={answers[field.id] || ''}
              onChange={(e) => handleAnswerChange(field.id, e.target.value)}
              required={field.required}
              multiline
              rows={4}
              error={field.required && !answers[field.id]}
              disabled={isViewOnly}
            />
            {renderHelpText(field.help_text)}
          </Box>
        );
      case 'select':
        return (
          <FormControl fullWidth required={field.required} error={field.required && !answers[field.id]}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={answers[field.id] || ''}
              onChange={(e) => handleAnswerChange(field.id, e.target.value)}
              label={field.label}
              disabled={isViewOnly}
            >
              {field.options.map((option) => (
                <MenuItem key={option.id} value={option.label}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText error={field.required && !answers[field.id]}>
              {field.help_text}
            </FormHelperText>
          </FormControl>
        );
      case 'radio':
        return (
          <FormControl required={field.required} error={field.required && !answers[field.id]}>
            <FormLabel>{field.label}</FormLabel>
            <RadioGroup
              value={answers[field.id] || ''}
              onChange={(e) => handleAnswerChange(field.id, e.target.value)}
              disabled={isViewOnly}
            >
              {field.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.label}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            <FormHelperText error={field.required && !answers[field.id]}>
              {field.help_text}
            </FormHelperText>
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormControl required={field.required} error={field.required && (!answers[field.id] || answers[field.id].length === 0)}>
            <FormLabel>{field.label}</FormLabel>
            <FormGroup>
              {field.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  control={
                    <Checkbox
                      checked={(answers[field.id] || []).includes(option.label)}
                      onChange={(e) => handleCheckboxChange(field.id, option.label, e.target.checked)}
                      disabled={isViewOnly}
                    />
                  }
                  label={option.label}
                />
              ))}
            </FormGroup>
            <FormHelperText error={field.required && (!answers[field.id] || answers[field.id].length === 0)}>
              {field.help_text}
            </FormHelperText>
          </FormControl>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" component="h2">
              {form.title}
            </Typography>
            {isViewOnly && (
              <Chip
                icon={<VisibilityIcon />}
                label="View Only"
                color="info"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          {onClose && (
            <Tooltip title="Close">
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {form.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {form.description}
          </Typography>
        )}

        {!isViewOnly && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please review your answers carefully. Once submitted, you will only be able to view your previous response.
          </Alert>
        )}

        <Box
          sx={{
            opacity: isViewOnly ? 0.8 : 1,
            pointerEvents: isViewOnly ? 'none' : 'auto',
          }}
        >
          {form.form_fields.map((field) => (
            <Box key={field.id} sx={{ mb: 2 }}>
              {renderField(field)}
            </Box>
          ))}

          {!isViewOnly && (
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={submitting}
                onClick={handleSubmitClick}
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </Button>
              {onClose && (
                <Button
                  variant="outlined"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit this form? Once submitted, you will only be able to view your previous response.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSubmit} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

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

export default FormSubmission; 