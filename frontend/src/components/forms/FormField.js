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

const FormField = ({ field, value, onChange, error }) => {
  const handleChange = (e) => {
    onChange(field.id, e.target.value);
  };

  const handleDateRangeChange = (e, isStartDate) => {
    const newValue = { 
      ...value || {}, // Initialize empty object if value is null
      [isStartDate ? 'startDate' : 'endDate']: e.target.value 
    };
    onChange(field.id, newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
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