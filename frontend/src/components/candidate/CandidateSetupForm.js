/**
 * Multi-step form for candidates to provide all necessary information for their visit.
 * Includes personal details, travel preferences, talk information, and visit preferences.
 * This form appears when a candidate needs to complete their profile setup.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Grid,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormHelperText,
  Avatar,
  FormGroup,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Paper,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { usersAPI } from '../../api/api';
import { format } from 'date-fns';

/**
 * Steps for the candidate setup wizard
 */
const steps = [
  'Personal Information',
  'Travel Details',
  'Talk Information',
  'Preferences',
  'Review & Submit'
];

/**
 * Available food preference options
 */
const FOOD_PREFERENCES = [
  'American',
  'Chinese',
  'French',
  'Indian',
  'Italian',
  'Japanese/Sushi',
  'Mexican',
  'Texas BBQ',
  'Other'
];

/**
 * Available dietary restriction options
 */
const DIETARY_RESTRICTIONS = [
  'NONE',
  'Kosher',
  'Vegan',
  'Vegetarian',
  'Other'
];

/**
 * Available campus/community tour options
 */
const TOUR_OPTIONS = [
  'Campus Tour',
  'Community Tour w/Realtor',
  'Not at this time'
];

/**
 * Personal Information step component.
 * Collects candidate's basic details and current position information.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @returns {React.ReactNode} Form step for personal information
 */
const PersonalInformationStep = ({ formData, handleInputChange }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6" gutterBottom>
      CANDIDATE INFORMATION
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleInputChange}
          error={formData.first_name.trim() === ''}
          helperText={formData.first_name.trim() === '' ? 'First name is required' : ''}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleInputChange}
          error={formData.last_name.trim() === ''}
          helperText={formData.last_name.trim() === '' ? 'Last name is required' : ''}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Current Title"
          name="current_title"
          value={formData.current_title}
          onChange={handleInputChange}
          error={formData.current_title.trim() === ''}
          helperText={formData.current_title.trim() === '' ? 'Current title is required' : ''}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Current Department"
          name="current_department"
          value={formData.current_department}
          onChange={handleInputChange}
          error={formData.current_department.trim() === ''}
          helperText={formData.current_department.trim() === '' ? 'Current department is required' : ''}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Current Institution"
          name="current_institution"
          value={formData.current_institution}
          onChange={handleInputChange}
          error={formData.current_institution.trim() === ''}
          helperText={formData.current_institution.trim() === '' ? 'Current institution is required' : ''}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Cell Number"
          name="cell_number"
          value={formData.cell_number}
          onChange={handleInputChange}
          error={formData.cell_number.trim() === ''}
          helperText={formData.cell_number.trim() === '' ? 'Cell number is required' : ''}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          multiline
          rows={4}
          label="Research/Teaching Interests"
          name="research_interests"
          value={formData.research_interests}
          onChange={handleInputChange}
          error={formData.research_interests.trim() === ''}
          helperText={formData.research_interests.trim() === '' ? 'Research/Teaching interests are required' : ''}
        />
      </Grid>
    </Grid>
  </Box>
);

/**
 * Travel Assistance step component.
 * Collects travel preferences, personal details for travel arrangements, and preferred visit dates.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @returns {React.ReactNode} Form step for travel details
 */
const TravelAssistanceStep = ({ formData, handleInputChange }) => {
  // Make sure we're working with a proper date array
  const visitDates = [...(formData.preferred_visit_dates || [
    { startDate: null, endDate: null },
    { startDate: null, endDate: null },
    { startDate: null, endDate: null }
  ])];
  
  // Ensure array has 3 elements
  while (visitDates.length < 3) {
    visitDates.push({ startDate: null, endDate: null });
  }
  
  // Convert string dates to Date objects if needed
  const normalizedVisitDates = visitDates.map(range => ({
    startDate: range.startDate ? new Date(range.startDate) : null,
    endDate: range.endDate ? new Date(range.endDate) : null
  }));
  
  /**
   * Handles changes to date range inputs
   * 
   * @param {number} index - Index of the date range to update
   * @param {string} field - Field to update ('startDate' or 'endDate')
   * @param {Date} date - New date value
   */
  const handleDateRangeChange = (index, field, date) => {
    // Create a copy of the date array
    const newDates = [...normalizedVisitDates];
    
    // Update the specific date field
    newDates[index] = {
      ...newDates[index],
      [field]: date
    };
    
    // Update the formData
    handleInputChange({
      target: {
        name: 'preferred_visit_dates',
        value: newDates
      }
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        TRAVEL ASSISTANCE
      </Typography>
      <Typography variant="body1" paragraph sx={{ mb: 4 }}>
        We are happy to provide all travel assistance needed. However, we also understand that you may have other trips you are coordinating and may want to handle your own arrangements and then submit for reimbursement. We are happy to accommodate either, or a hybrid. (Please note that lodging will automatically be booked by the department.)
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
          Would you like assistance in booking your travel, including air, car rental, or shuttle service? Please note that your lodging will automatically be reserved by the department.
        </Typography>
        <RadioGroup
          name="travel_assistance"
          value={formData.travel_assistance}
          onChange={handleInputChange}
        >
          <FormControlLabel 
            value="all" 
            control={<Radio />} 
            label="Yes, I will need help with ALL travel arrangements." 
          />
          <FormControlLabel 
            value="some" 
            control={<Radio />} 
            label="Yes, I will need help with SOME of my travel arrangements." 
          />
          <FormControlLabel 
            value="none" 
            control={<Radio />} 
            label="No, I will book ALL travel arrangements and will submit for reimbursement." 
          />
        </RadioGroup>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
        Please Provide the following information which will be helpful with the travel and reimbursement process
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Full Name (as it appears on your passport)"
            name="passport_name"
            value={formData.passport_name}
            onChange={handleInputChange}
            error={formData.passport_name?.trim() === ''}
            helperText={formData.passport_name?.trim() === '' ? 'Passport name is required' : ''}
          />
        </Grid>

        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date of Birth"
              value={formData.date_of_birth}
              onChange={(newValue) => {
                handleInputChange({
                  target: {
                    name: 'date_of_birth',
                    value: newValue
                  }
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required
                  error={!formData.date_of_birth}
                  helperText={!formData.date_of_birth ? 'Date of birth is required' : ''}
                />
              )}
              inputFormat="yyyy-MM-dd"
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Country of Residence"
            name="country_of_residence"
            value={formData.country_of_residence}
            onChange={handleInputChange}
            error={formData.country_of_residence?.trim() === ''}
            helperText={formData.country_of_residence?.trim() === '' ? 'Country of residence is required' : ''}
          />
        </Grid>

        <Grid item xs={12}>
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.primary' }}>
              Gender
            </Typography>
            <RadioGroup
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
            >
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel value="female" control={<Radio />} label="Female" />
              <FormControlLabel value="other" control={<Radio />} label="Other" />
              <FormControlLabel value="prefer_not_to_say" control={<Radio />} label="Prefer not to say" />
            </RadioGroup>
          </Box>
        </Grid>

        {formData.gender === 'other' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Please specify gender"
              name="gender_custom"
              value={formData.gender_custom}
              onChange={handleInputChange}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Preferred Airport"
            name="preferred_airport"
            value={formData.preferred_airport}
            onChange={handleInputChange}
            error={formData.preferred_airport?.trim() === ''}
            helperText={formData.preferred_airport?.trim() === '' ? 'Preferred airport is required' : ''}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Frequent Flier Information"
            name="frequent_flyer_info"
            value={formData.frequent_flyer_info}
            onChange={handleInputChange}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Known Traveler Number (Optional)"
            name="known_traveler_number"
            value={formData.known_traveler_number}
            onChange={handleInputChange}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        PREFERRED VISIT DATES
      </Typography>
      
      <Typography variant="body2" paragraph color="text.secondary">
        Please select up to three date ranges when you would be available for an on-site visit. 
        These are preferences only and are not guaranteed. We will do our best to accommodate your schedule.
      </Typography>
      
      <Grid container spacing={3}>
        {[0, 1, 2].map((index) => (
          <Grid item xs={12} key={index}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
              <Typography variant="subtitle1">Option {index + 1}:</Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={normalizedVisitDates[index]?.startDate}
                  onChange={(date) => handleDateRangeChange(index, 'startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="MMMM d, yyyy"
                />
                <DatePicker
                  label="End Date"
                  value={normalizedVisitDates[index]?.endDate}
                  onChange={(date) => handleDateRangeChange(index, 'endDate', date)}
                  minDate={normalizedVisitDates[index]?.startDate || new Date()}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="MMMM d, yyyy"
                />
              </LocalizationProvider>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

/**
 * Talk Information step component.
 * Collects details about the candidate's talk, including title, abstract, biography,
 * headshot upload, and permissions for recording/advertising.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.setFormData - Function to directly update form data
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {Function} props.onFileUpload - Function to handle file uploads
 * @param {string|null} props.headshotPreview - URL for headshot preview
 * @param {Function} props.setHeadshotPreview - Function to update headshot preview
 * @param {string|null} props.uploadError - Error message for failed uploads
 * @param {Function} props.setUploadError - Function to update upload error message
 * @param {Function} props.onHeadshotRemove - Function to remove uploaded headshot
 * @returns {React.ReactNode} Form step for talk information
 */
const TalkInformationStep = ({ 
  formData, 
  setFormData,
  handleInputChange, 
  onFileUpload,
  headshotPreview,
  setHeadshotPreview,
  uploadError,
  setUploadError,
  onHeadshotRemove
}) => {
  const fileInputRef = useRef(null);

  /**
   * Handles file selection and validation before upload
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event
   */
  const handleFileSelect = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      // Create preview immediately
      const previewUrl = URL.createObjectURL(file);
      setHeadshotPreview(previewUrl);

      // Create form data
      const formData = new FormData();
      formData.append('headshot', file);

      try {
        await onFileUpload(formData);
      } catch (error) {
        setUploadError('Failed to process file. Please try again.');
      }
    } catch (error) {
      setUploadError('Failed to process file. Please try again.');
    }
  };

  /**
   * Triggers file input click
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles changes to permission radio buttons
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event
   */
  const handlePermissionChange = (event) => {
    const { name, value } = event.target;
    handleInputChange({
      target: {
        name,
        value
      }
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        TALK INFORMATION
      </Typography>
      <Typography variant="body1" paragraph sx={{ mb: 4 }}>
        Please provide the following information so we may share your upcoming visit and talk with our faculty and students.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Talk Title"
            name="talk_title"
            value={formData.talk_title}
            onChange={handleInputChange}
            error={formData.talk_title?.trim() === ''}
            helperText={formData.talk_title?.trim() === '' ? 'Talk title is required' : ''}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            multiline
            rows={6}
            label="Abstract"
            name="abstract"
            value={formData.abstract}
            onChange={handleInputChange}
            error={formData.abstract?.trim() === ''}
            helperText={formData.abstract?.trim() === '' ? 'Abstract is required' : ''}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            multiline
            rows={4}
            label="Biography"
            name="biography"
            value={formData.biography}
            onChange={handleInputChange}
            error={formData.biography?.trim() === ''}
            helperText={formData.biography?.trim() === '' ? 'Biography is required' : ''}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.primary' }}>
            Please upload a headshot to be used in advertising your talk
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Button
                variant="outlined"
                component="span"
                onClick={handleButtonClick}
                startIcon={<CloudUploadIcon />}
              >
                Choose File
              </Button>

              {uploadError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {uploadError}
                </Typography>
              )}

              {(headshotPreview || formData.headshot_url) && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={headshotPreview || formData.headshot_url}
                    alt="Headshot preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '4px'
                    }}
                  />
                  <IconButton
                    onClick={() => {
                      onHeadshotRemove();
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}

              {!headshotPreview && !formData.headshot_url && !uploadError && (
                <FormHelperText error>Headshot is required</FormHelperText>
              )}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel sx={{ color: 'text.primary' }}>Your talk will be videotaped and shared with the department faculty who are not able to attend in person.</FormLabel>
              <RadioGroup
                name="videotape_permission"
                value={formData.videotape_permission}
                onChange={handlePermissionChange}
                row
              >
                <FormControlLabel 
                  value="yes" 
                  control={<Radio color="primary" />} 
                  label="Yes" 
                />
                <FormControlLabel 
                  value="no" 
                  control={<Radio color="primary" />} 
                  label="No" 
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel sx={{ color: 'text.primary' }}>Do you give permission to advertise your talk?</FormLabel>
              <RadioGroup
                name="advertisement_permission"
                value={formData.advertisement_permission}
                onChange={handlePermissionChange}
                row
              >
                <FormControlLabel 
                  value="yes" 
                  control={<Radio color="primary" />} 
                  label="Yes" 
                />
                <FormControlLabel 
                  value="no" 
                  control={<Radio color="primary" />} 
                  label="No" 
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Preferences step component.
 * Collects candidate preferences for food, dietary restrictions, tours, and faculty meetings.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {Array} props.facultyList - List of faculty members available for meetings
 * @returns {React.ReactNode} Form step for candidate preferences
 */
const PreferencesStep = ({ formData, handleInputChange, facultyList }) => {
  const [otherFoodPreference, setOtherFoodPreference] = useState(
    formData.other_food_preference || ''
  );
  const [otherDietaryRestriction, setOtherDietaryRestriction] = useState(
    formData.other_dietary_restriction || ''
  );

  /**
   * Updates the form data when "Other" food preference is selected and details provided
   */
  useEffect(() => {
    if (formData.food_preferences?.includes('Other')) {
      handleInputChange({
        target: {
          name: 'other_food_preference',
          value: otherFoodPreference
        }
      });
    }
  }, [otherFoodPreference]);

  /**
   * Updates the form data when "Other" dietary restriction is selected and details provided
   */
  useEffect(() => {
    if (formData.dietary_restrictions?.includes('Other')) {
      handleInputChange({
        target: {
          name: 'other_dietary_restriction',
          value: otherDietaryRestriction
        }
      });
    }
  }, [otherDietaryRestriction]);

  /**
   * Handles food preference selection changes, limiting to a maximum of 3 options
   * @param {React.ChangeEvent<HTMLInputElement>} event - Selection change event
   */
  const handleFoodPreferencesChange = (event) => {
    const value = event.target.value;
    // Ensure value is always an array
    const newValue = Array.isArray(value) ? value : [];
    
    // Remove "Other" if it was previously selected but not in new selection
    if (formData.food_preferences?.includes('Other') && !newValue.includes('Other')) {
      setOtherFoodPreference('');
    }
    
    // Limit to 3 selections
    if (newValue.length <= 3) {
      handleInputChange({
        target: {
          name: 'food_preferences',
          value: newValue
        }
      });
    }
  };

  /**
   * Handles dietary restriction selection changes
   * @param {React.ChangeEvent<HTMLInputElement>} event - Selection change event
   */
  const handleDietaryRestrictionsChange = (event) => {
    const value = event.target.value;
    // Ensure value is always an array
    const newValue = Array.isArray(value) ? value : [];
    
    // Remove "Other" if it was previously selected but not in new selection
    if (formData.dietary_restrictions?.includes('Other') && !newValue.includes('Other')) {
      setOtherDietaryRestriction('');
    }
    
    handleInputChange({
      target: {
        name: 'dietary_restrictions',
        value: newValue
      }
    });
  };

  /**
   * Updates preferred faculty selection at a specific index
   * @param {number} index - Index position to update
   * @param {string} value - Faculty ID to set
   */
  const handleFacultyChange = (index, value) => {
    const newFacultyPreferences = [...(formData.preferred_faculty || [])];
    // Make sure array has at least 4 elements
    while (newFacultyPreferences.length < 4) {
      newFacultyPreferences.push('');
    }
    newFacultyPreferences[index] = value;
    
    // Remove empty selections from the end
    const cleanedPreferences = newFacultyPreferences.filter(id => id !== '');
    
    handleInputChange({
      target: {
        name: 'preferred_faculty',
        value: cleanedPreferences
      }
    });
  };

  /**
   * Filters faculty list to include only those who haven't been selected
   * in other slots (to prevent duplicate selections)
   * @param {number} currentIndex - Current selection index
   * @returns {Array} Filtered list of available faculty
   */
  const getAvailableFaculty = (currentIndex) => {
    const selectedFaculty = formData.preferred_faculty || ['', '', '', ''];
    return facultyList.filter(faculty => 
      !selectedFaculty.includes(faculty.id) || 
      selectedFaculty[currentIndex] === faculty.id
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        ON-SITE PREFERENCES
      </Typography>
      <Typography variant="body1" paragraph sx={{ mb: 4 }}>
        We want to ensure you have the BEST visit possible to CSE @ TAMU. Please indicate your preferences below.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.primary' }}>
              What type of food do you prefer? Please limit to (3).
            </Typography>
            <Select
              multiple
              value={formData.food_preferences || []}
              onChange={handleFoodPreferencesChange}
              input={<OutlinedInput />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Array.isArray(selected) && selected.map((value) => (
                    <Chip key={value} label={
                      value === 'Other' ? otherFoodPreference || 'Other' : value
                    } />
                  ))}
                </Box>
              )}
            >
              {FOOD_PREFERENCES.map((option) => (
                <MenuItem
                  key={option}
                  value={option}
                  disabled={
                    (formData.food_preferences || []).length >= 3 &&
                    !(formData.food_preferences || []).includes(option)
                  }
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
            {(formData.food_preferences || []).includes('Other') && (
              <TextField
                fullWidth
                margin="normal"
                label="Please specify other food preference"
                value={otherFoodPreference}
                onChange={(e) => {
                  setOtherFoodPreference(e.target.value);
                }}
              />
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.primary' }}>
              Do you have any dietary restrictions or preferences?
            </Typography>
            <Select
              multiple
              value={formData.dietary_restrictions || []}
              onChange={handleDietaryRestrictionsChange}
              input={<OutlinedInput />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Array.isArray(selected) && selected.map((value) => (
                    <Chip key={value} label={
                      value === 'Other' ? otherDietaryRestriction || 'Other' : value
                    } />
                  ))}
                </Box>
              )}
            >
              {DIETARY_RESTRICTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {(formData.dietary_restrictions || []).includes('Other') && (
              <TextField
                fullWidth
                margin="normal"
                label="Please specify other dietary restriction"
                value={otherDietaryRestriction}
                onChange={(e) => {
                  setOtherDietaryRestriction(e.target.value);
                }}
              />
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth sx={{ mt: 3 }}>
            <FormLabel sx={{ color: 'text.primary' }}>If time allows, would you be interested in one of the following?</FormLabel>
            <Select
              name="extra_tours"
              value={formData.extra_tours}
              onChange={handleInputChange}
            >
              <MenuItem value="Campus Tour">Campus Tour</MenuItem>
              <MenuItem value="Community Tour w/Realtor">Community Tour w/Realtor</MenuItem>
              <MenuItem value="Not at this time">Not at this time</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.primary' }}>
            Please list up to FOUR (4) faculty members you would most like to meet with during your on-site visit.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            NO guarantees, but an invitation will be extended.
          </Typography>
          <Grid container spacing={2}>
            {[0, 1, 2, 3].map((index) => (
              <Grid item xs={12} sm={6} key={index}>
                <FormControl fullWidth>
                  <Select
                    value={formData.preferred_faculty?.[index] || ''}
                    onChange={(e) => handleFacultyChange(index, e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select Faculty Member {index + 1}</em>
                    </MenuItem>
                    {getAvailableFaculty(index).map((faculty) => (
                      <MenuItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Review step component.
 * Displays a summary of all provided information for final review before submission.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Array} props.facultyList - List of faculty members
 * @returns {React.ReactNode} Form step for review
 */
const ReviewStep = ({ formData, facultyList }) => {
  /**
   * Formats date ranges consistently
   * @param {Object} dateRange - Object containing startDate and endDate
   * @returns {string|null} Formatted date range string or null if dates are missing
   */
  const formatDateRange = (dateRange) => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return null;
    
    // Function to format date objects nicely with month name
    const formatDate = (date) => {
      try {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return String(date); // Fallback if date parsing fails
      }
    };
    
    return `${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`;
  };

  /**
   * Retrieves faculty names from their IDs
   * @returns {Array} List of faculty names
   */
  const getFacultyNames = () => {
    if (!formData.preferred_faculty || !Array.isArray(formData.preferred_faculty) || formData.preferred_faculty.length === 0) {
      return [];
    }
    
    return formData.preferred_faculty
      .map(id => {
        const faculty = facultyList.find(f => f.id === id);
        return faculty ? faculty.name : '';
      })
      .filter(name => name !== '');
  };

  // Make sure preferred_visit_dates exists
  const visitDates = formData.preferred_visit_dates || [];
  
  return (
    <Box sx={{ mt: 2 }}>
      {/* Disclaimer */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Please let me know directly should you have any accommodations needed to fully participate in the on-site interview
        </Typography>
        <Typography variant="body1">
          Kathy Waskom @ (979) 845-3535 or k-waskom@tamu.edu
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom>
        REVIEW & SUBMIT
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Personal Information</Typography>
        <Typography>Name: {formData.first_name} {formData.last_name}</Typography>
        <Typography>Current Title: {formData.current_title}</Typography>
        <Typography>Department: {formData.current_department}</Typography>
        <Typography>Institution: {formData.current_institution}</Typography>
        <Typography>Cell Number: {formData.cell_number}</Typography>
        <Typography>Research Interests: {formData.research_interests}</Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Travel Information</Typography>
        <Typography>Travel Assistance: {formData.travel_assistance}</Typography>
        <Typography>Passport Name: {formData.passport_name}</Typography>
        <Typography>Date of Birth: {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : ''}</Typography>
        <Typography>Country of Residence: {formData.country_of_residence}</Typography>
        <Typography>Gender: {formData.gender === 'other' ? formData.gender_custom : formData.gender}</Typography>
        <Typography>Preferred Airport: {formData.preferred_airport}</Typography>
        <Typography>Frequent Flyer Info: {formData.frequent_flyer_info}</Typography>
        <Typography>Known Traveler Number: {formData.known_traveler_number}</Typography>
        
        {/* Add preferred visit dates section with better visibility */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
          Preferred Visit Dates:
        </Typography>
        {visitDates.length > 0 ? (
          visitDates.map((dateRange, index) => {
            const formattedRange = formatDateRange(dateRange);
            return formattedRange ? (
              <Typography key={index}>Option {index + 1}: {formattedRange}</Typography>
            ) : null;
          })
        ) : (
          <Typography>No preferred dates selected</Typography>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Talk Information</Typography>
        <Typography>Talk Title: {formData.talk_title}</Typography>
        <Typography>Abstract: {formData.abstract}</Typography>
        <Typography>Biography: {formData.biography}</Typography>
        <Typography>Videotape Permission: {formData.videotape_permission === 'yes' ? 'Yes' : 'No'}</Typography>
        <Typography>Advertisement Permission: {formData.advertisement_permission === 'yes' ? 'Yes' : 'No'}</Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Preferences</Typography>
        <Typography>Food Preferences: {formData.food_preferences.join(', ')}</Typography>
        {formData.food_preferences.includes('Other') && (
          <Typography>Other Food Preference: {formData.other_food_preference}</Typography>
        )}
        <Typography>Dietary Restrictions: {formData.dietary_restrictions.join(', ')}</Typography>
        {formData.dietary_restrictions.includes('Other') && (
          <Typography>Other Dietary Restriction: {formData.other_dietary_restriction}</Typography>
        )}
        <Typography>Extra Tours: {formData.extra_tours}</Typography>
        <Typography>Preferred Faculty: {getFacultyNames().join(', ')}</Typography>
      </Paper>
    </Box>
  );
};

/**
 * Main candidate setup form component.
 * Multi-step wizard that guides candidates through providing all necessary information.
 * Includes form state management, validation, file uploads, and submission handling.
 * 
 * @returns {React.ReactNode} Multi-step form dialog
 */
const CandidateSetupForm = () => {
  const { user, setUser, setShowCandidateSetup } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  
  /**
   * Initial form state with all required fields
   */
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    current_title: '',
    current_department: '',
    current_institution: '',
    research_interests: '',
    cell_number: '',
    travel_assistance: 'none',
    passport_name: '',
    date_of_birth: null,
    country_of_residence: '',
    gender: '',
    gender_custom: '',
    preferred_airport: '',
    frequent_flyer_info: '',
    known_traveler_number: '',
    talk_title: '',
    abstract: '',
    biography: '',
    headshot_url: null,
    videotape_permission: 'no',
    advertisement_permission: 'no',
    food_preferences: [],
    dietary_restrictions: [],
    extra_tours: 'Not at this time',
    preferred_faculty: [],
    preferred_visit_dates: [
      { startDate: null, endDate: null },
      { startDate: null, endDate: null },
      { startDate: null, endDate: null }
    ]
  });
  
  // Form state and UI state variables
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedHeadshot, setSelectedHeadshot] = useState(null);
  const [headshotPreview, setHeadshotPreview] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const dialogContentRef = useRef(null); // Ref for scrolling

  /**
   * Load user data when component mounts
   */
  useEffect(() => {
    if (user) {
      setFormData(prev => {
        // Start with existing state
        const newFormData = { ...prev };
        
        // Update name fields
        newFormData.first_name = user.first_name || '';
        newFormData.last_name = user.last_name || '';
        
        // Initialize preferred_visit_dates if it doesn't exist or is empty
        if (!newFormData.preferred_visit_dates || !newFormData.preferred_visit_dates.length) {
          newFormData.preferred_visit_dates = [
            { startDate: null, endDate: null },
            { startDate: null, endDate: null },
            { startDate: null, endDate: null }
          ];
        }
        
        return newFormData;
      });
    }
  }, [user]);

  /**
   * Fetch faculty list for meeting preferences
   */
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await usersAPI.getUsers();
        
        // Filter out null/undefined users and ensure user_type exists
        const facultyMembers = (response.data || [])
          .filter(user => 
            user && 
            user.user_type && 
            ['faculty', 'admin', 'superadmin'].includes(user.user_type) && 
            user.first_name && 
            user.last_name &&
            user.available_for_meetings !== false  // Only show faculty who are available for meetings
          )
          .map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
          }));

        setFacultyList(facultyMembers);
      } catch (error) {
        setFacultyList([]);
      }
    };
    
    fetchFaculty();
  }, []);

  /**
   * Generic input change handler for form fields
   * @param {Object} event - Input change event
   */
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    
    setFormData(prev => {
      // Special handling for preferred_visit_dates to ensure proper copying
      if (name === 'preferred_visit_dates') {
        return {
          ...prev,
          [name]: JSON.parse(JSON.stringify(value)) // Deep copy to avoid reference issues
        };
      }
      
      // Default handling for other fields
      return {
        ...prev,
        [name]: value
      };
    });
  };

  /**
   * Scrolls dialog to top when changing steps
   */
  const scrollToTop = () => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  /**
   * Advances to the next step in the wizard
   */
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
    scrollToTop();
  };

  /**
   * Returns to the previous step in the wizard
   */
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    scrollToTop();
  };

  /**
   * Handles form submission, formats data, and sends to API
   */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmissionError(null);

      // Format preferred visit dates for submission
      const visitDates = formData.preferred_visit_dates || [];
      const formattedPreferredDates = visitDates
        .filter(dateRange => dateRange && dateRange.startDate && dateRange.endDate)
        .map(dateRange => ({
          startDate: format(new Date(dateRange.startDate), 'yyyy-MM-dd'), 
          endDate: format(new Date(dateRange.endDate), 'yyyy-MM-dd')
        }));
      
      const submissionData = {
        ...formData,
        date_of_birth: formData.date_of_birth ? 
          format(new Date(formData.date_of_birth), 'yyyy-MM-dd') : 
          null,
        preferred_visit_dates: formattedPreferredDates
      };

      const response = await usersAPI.completeCandidateSetup(submissionData);
      
      // Simplify success handling - just close the dialog
      if (response?.data) {
        // Update user state
        if (user) {
          setUser({
            ...user,
            has_completed_setup: true
          });
        }
        
        // Close the form immediately
        setShowCandidateSetup(false);
      }
    } catch (error) {
      setSubmissionError(error.response?.data?.error || 'Failed to submit profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Closes the setup form
   */
  const handleClose = () => {
    setShowCandidateSetup(false);
  };

  /**
   * Returns the appropriate component for the current step
   * @param {number} step - Current step index
   * @returns {React.ReactNode} Step component
   */
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <PersonalInformationStep formData={formData} handleInputChange={handleInputChange} />;
      case 1:
        return <TravelAssistanceStep formData={formData} handleInputChange={handleInputChange} />;
      case 2:
        return (
          <TalkInformationStep 
            formData={formData} 
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            onFileUpload={handleFileUpload}
            headshotPreview={headshotPreview}
            setHeadshotPreview={setHeadshotPreview}
            uploadError={uploadError}
            setUploadError={setUploadError}
            onHeadshotRemove={handleHeadshotRemove}
          />
        );
      case 3:
        return <PreferencesStep 
          formData={formData} 
          handleInputChange={handleInputChange}
          facultyList={facultyList} 
        />;
      case 4:
        return <ReviewStep formData={formData} facultyList={facultyList} />;
      default:
        return null;
    }
  };

  /**
   * Removes headshot preview and clears headshot URL from form data
   */
  const handleHeadshotRemove = () => {
    setHeadshotPreview(null);
    setFormData(prev => ({
      ...prev,
      headshot_url: null
    }));
    setUploadError(null);
  };

  /**
   * Validates file type and size for uploads
   * @param {File} file - File to validate
   * @returns {boolean} Whether the file is valid
   */
  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file (JPEG, PNG, etc.)');
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    return true;
  };

  /**
   * Uploads headshot file to server and updates form data with URL
   * @param {FormData} formData - FormData object containing file
   * @returns {Object} Upload response from API
   */
  const handleFileUpload = async (formData) => {
    try {
      const response = await usersAPI.uploadHeadshot(formData);
      if (response && response.url) {
        setFormData(prev => ({
          ...prev,
          headshot_url: response.url
        }));
        setUploadError(null);
      }
      return response;
    } catch (error) {
      setUploadError('Failed to upload file. Please try again.');
      throw error;
    }
  };

  /**
   * Validates the preferences step
   * @returns {boolean} Whether the step is valid
   */
  const isStepFourValid = () => {
    return (
      Array.isArray(formData.food_preferences) && formData.food_preferences.length > 0 &&
      Array.isArray(formData.dietary_restrictions) && formData.dietary_restrictions.length > 0 &&
      formData.extra_tours !== ''
      // Note: preferred_faculty is optional, so not included in validation
    );
  };

  return (
    <Dialog
      open={true}
      maxWidth="md"
      fullWidth
      scroll="paper"
      disableEscapeKeyDown={true}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose(event);
        }
      }}
    >
      <DialogTitle>
        Candidate Setup
      </DialogTitle>
      <DialogContent ref={dialogContentRef} sx={{ minHeight: '60vh' }}>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep <= 4 ? getStepContent(activeStep) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Thank you for completing your profile setup!
            </Typography>
            <Typography variant="body1">
              Your information has been successfully submitted.
            </Typography>
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{ mt: 3 }}
            >
              Return to Home
            </Button>
          </Box>
        )}

        {submissionError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submissionError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pb: 2 }}>
          {activeStep !== 0 && activeStep <= 4 && (
            <Button
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
          )}
          {activeStep === 4 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          ) : activeStep < 4 && (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>

        {submissionSuccess && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Profile successfully submitted!
            </Typography>
            <Typography variant="body1">
              Thank you for completing your profile setup. Redirecting to dashboard...
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateSetupForm;
export { 
  PersonalInformationStep, 
  TravelAssistanceStep, 
  TalkInformationStep, 
  PreferencesStep, 
  ReviewStep 
};