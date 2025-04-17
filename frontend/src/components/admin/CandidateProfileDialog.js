import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../config';
import { usersAPI } from '../../api/api';

const CandidateProfileDialog = ({ open, onClose, candidate }) => {
  const getHeadshotUrl = (url) => {
    if (!url) return null;
    // If the URL is already absolute (starts with http), return as is
    if (url.startsWith('http')) return url;
    // Otherwise, prepend the API base URL
    return `${API_BASE_URL}${url}`;
  };

  const handleDownloadHeadshot = async () => {
    if (candidate?.candidate_profile?.headshot_url) {
      try {
        // Create a link to download directly from the backend server
        const link = document.createElement('a');
        link.href = `${API_BASE_URL}/api/users/download_headshot/?url=${encodeURIComponent(candidate.candidate_profile.headshot_url)}`;
        link.download = `${candidate.first_name}_${candidate.last_name}_headshot.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading headshot:', error);
      }
    }
  };

  // Add a helper function to format date ranges
  const formatDateRange = (dateRange) => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return null;
    
    return `${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`;
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Candidate Profile: {candidate.first_name} {candidate.last_name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Headshot Section */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              {candidate?.candidate_profile?.headshot_url ? (
                <>
                  <Box
                    component="img"
                    src={candidate.candidate_profile.headshot_url}
                    alt="Candidate Headshot"
                    sx={{
                      width: '100%',
                      maxWidth: 200,
                      height: 'auto',
                      borderRadius: 1
                    }}
                  />
                  <IconButton 
                    onClick={handleDownloadHeadshot}
                    sx={{ mt: 1 }}
                    title="Download Headshot"
                  >
                    <DownloadIcon />
                  </IconButton>
                </>
              ) : (
                <Typography color="textSecondary">No headshot available</Typography>
              )}
            </Paper>
          </Grid>

          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Current Title</Typography>
                  <Typography>{candidate.candidate_profile?.current_title}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Department</Typography>
                  <Typography>{candidate.candidate_profile?.current_department}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Institution</Typography>
                  <Typography>{candidate.candidate_profile?.current_institution}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Cell Number</Typography>
                  <Typography>{candidate.candidate_profile?.cell_number}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Research & Talk</Typography>
              <Typography variant="subtitle2">Research Interests</Typography>
              <Typography paragraph>{candidate.candidate_profile?.research_interests}</Typography>
              
              <Typography variant="subtitle2">Talk Title</Typography>
              <Typography paragraph>{candidate.candidate_profile?.talk_title}</Typography>
              
              <Typography variant="subtitle2">Abstract</Typography>
              <Typography paragraph>{candidate.candidate_profile?.abstract}</Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Travel Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Travel Assistance</Typography>
                  <Typography>{candidate.candidate_profile?.travel_assistance}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Preferred Airport</Typography>
                  <Typography>{candidate.candidate_profile?.preferred_airport}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Passport Name</Typography>
                  <Typography>{candidate.candidate_profile?.passport_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Date of Birth</Typography>
                  <Typography>
                    {candidate.candidate_profile?.date_of_birth ? 
                     new Date(candidate.candidate_profile.date_of_birth).toLocaleDateString() : ''}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Gender</Typography>
                  <Typography>
                    {candidate.candidate_profile?.gender === 'other' ? 
                     candidate.candidate_profile?.gender_custom : 
                     candidate.candidate_profile?.gender}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Known Traveler Number</Typography>
                  <Typography>{candidate.candidate_profile?.known_traveler_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Frequent Flyer Info</Typography>
                  <Typography>{candidate.candidate_profile?.frequent_flyer_info}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Country of Residence</Typography>
                  <Typography>{candidate.candidate_profile?.country_of_residence}</Typography>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Preferred Visit Dates</Typography>
                {candidate.candidate_profile?.preferred_visit_dates && 
                 Array.isArray(candidate.candidate_profile.preferred_visit_dates) && 
                 candidate.candidate_profile.preferred_visit_dates.length > 0 ? (
                  candidate.candidate_profile.preferred_visit_dates.map((dateRange, index) => {
                    const formattedRange = formatDateRange(dateRange);
                    return formattedRange ? (
                      <Typography key={index}>Option {index + 1}: {formattedRange}</Typography>
                    ) : null;
                  })
                ) : (
                  <Typography color="text.secondary">No preferred dates provided</Typography>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Preferences</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Food Preferences</Typography>
                  <Typography>{candidate.candidate_profile?.food_preferences?.join(', ')}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Dietary Restrictions</Typography>
                  <Typography>{candidate.candidate_profile?.dietary_restrictions?.join(', ')}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Preferred Faculty</Typography>
                  <Typography>{candidate.candidate_profile?.preferred_faculty?.join(', ')}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidateProfileDialog;
