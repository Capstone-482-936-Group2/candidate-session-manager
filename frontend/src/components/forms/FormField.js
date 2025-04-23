/**
 * Reusable form field component that renders different input types based on field configuration.
 * Supports text, textarea, select, radio, checkbox, date, and date range input types.
 * Handles value changes and error states consistently across all field types.
 */
import React from 'react';
import {
  TextField,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Box,
  Typography
} from '@mui/material';

/**
 * Renders an appropriate form field based on the field type configuration.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.field - Field configuration object containing field type, label, options, etc.
 * @param {any} props.value - Current value of the field
 * @param {Function} props.onChange - Handler function that receives field id and new value
 * @param {string|null} props.error - Error message to display if field validation fails
 * @returns {React.ReactNode} Rendered form field based on field type
 */
const FormField = ({ field, value, onChange, error }) => {
  /**
   * Handles standard input field changes
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   */
  const handleChange = (e) => {
    onChange(field.id, e.target.value);
  };

  /**
   * Handles date range field changes by updating either start or end date
   * while preserving the other value
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   * @param {boolean} isStartDate - Whether the change is for the start date (true) or end date (false)
   */
  const handleDateRangeChange = (e, isStartDate) => {
    const newValue = { 
      ...value || {}, // Initialize empty object if value is null
      [isStartDate ? 'startDate' : 'endDate']: e.target.value 
    };
    onChange(field.id, newValue);
  };

  /**
   * Renders the appropriate field component based on field type
   * @returns {React.ReactNode} Field component
   */
  const renderField = () => {
    switch (field.type) {
      case 'text':
        // Single line text input
        return (
          <TextField
            fullWidth
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error}
            variant="outlined"
          />
        );
      case 'textarea':
        // Multi-line text input
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error}
            variant="outlined"
          />
        );
      case 'select':
        // Dropdown selection input
        return (
          <FormControl fullWidth error={!!error}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value || ''}
              onChange={handleChange}
              label={field.label}
            >
              {field.options.map((option) => (
                <MenuItem key={option.label} value={option.label}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      case 'radio':
        // Radio button group input
        return (
          <FormControl component="fieldset" error={!!error}>
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup value={value || ''} onChange={handleChange}>
              {field.options.map((option) => (
                <FormControlLabel
                  key={option.label}
                  value={option.label}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      case 'checkbox':
        // Multiple selection checkbox group
        return (
          <FormControl component="fieldset" error={!!error}>
            <FormLabel component="legend">{field.label}</FormLabel>
            <FormGroup>
              {field.options.map((option) => (
                <FormControlLabel
                  key={option.label}
                  control={
                    <Checkbox
                      checked={value?.includes(option.label) || false}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...(value || []), option.label]
                          : (value || []).filter((v) => v !== option.label);
                        onChange(field.id, newValue);
                      }}
                    />
                  }
                  label={option.label}
                />
              ))}
            </FormGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      case 'date':
        // Single date picker input
        return (
          <TextField
            fullWidth
            type="date"
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
          />
        );
      case 'date_range':
        // Date range with start and end date inputs
        return (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={value?.startDate || ''}
              onChange={(e) => handleDateRangeChange(e, true)}
              error={!!error}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={value?.endDate || ''}
              onChange={(e) => handleDateRangeChange(e, false)}
              error={!!error}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        {field.label}
        {field.required && <span style={{ color: 'red' }}> *</span>}
      </Typography>
      {renderField()}
    </Box>
  );
};

export default FormField; 