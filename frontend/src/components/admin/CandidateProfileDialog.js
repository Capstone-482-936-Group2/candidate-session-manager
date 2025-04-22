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
  IconButton,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Flight as FlightIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Today as TodayIcon,
  Wc as GenderIcon,
  AssignmentInd as PassportIcon,
  Restaurant as FoodIcon,
  Person as PersonIcon,
  EventNote as EventIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../../config';
import { usersAPI } from '../../api/api';

const CandidateProfileDialog = ({ open, onClose, candidate }) => {
  const theme = useTheme();

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

  // Helper to display field with icon
  const LabeledField = ({ icon, label, value, xs = 6, iconColor = 'primary.main' }) => (
    <Grid item xs={12} sm={xs}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ 
          mr: 1.5, 
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 0.5
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
            {label}
          </Typography>
          <Typography variant="body2">
            {value || <Typography variant="body2" component="span" color="text.disabled">Not provided</Typography>}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );

  if (!candidate) return null;
  
  const profile = candidate.candidate_profile || {};

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        elevation: 5,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        px: 3,
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main', 
              mr: 2,
              width: 45,
              height: 45,
              fontSize: '1.2rem',
              fontWeight: 600
            }}
          >
            {candidate.first_name?.[0] || ''}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={600} color="primary.dark">
              {candidate.first_name} {candidate.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {candidate.email}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Headshot Section */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={1}
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Candidate Photo
                </Typography>
              </Box>
              
              <CardContent sx={{ 
                p: 0, 
                flexGrow: 1
              }}>
                {profile.headshot_url ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Box
                      component="img"
                      src={getHeadshotUrl(profile.headshot_url)}
                      alt="Candidate Headshot"
                      sx={{
                        width: '100%',
                        maxWidth: 200,
                        height: 'auto',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        mb: 2,
                        mt: 1
                      }}
                    />
                    <Tooltip title="Download Headshot">
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadHeadshot}
                        size="small"
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Download
                      </Button>
                    </Tooltip>
                  </Box>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 150,
                        height: 150,
                        fontSize: '3rem',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        mx: 'auto',
                        mb: 2,
                        mt: 1
                      }}
                    >
                      {candidate.first_name?.[0] || ''}
                    </Avatar>
                    <Typography color="text.secondary">
                      No photo available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Card 
              elevation={1}
              sx={{ 
                borderRadius: 2,
                mb: 3
              }}
            >
              <Box sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Professional Information
                </Typography>
              </Box>
              
              <CardContent sx={{ px: 3, py: 2 }}>
                <Grid container spacing={3}>
                  <LabeledField 
                    icon={<WorkIcon fontSize="small" />}
                    label="Current Title"
                    value={profile.current_title}
                  />
                  <LabeledField 
                    icon={<SchoolIcon fontSize="small" />}
                    label="Institution"
                    value={profile.current_institution}
                  />
                  <LabeledField 
                    icon={<SchoolIcon fontSize="small" />}
                    label="Department"
                    value={profile.current_department}
                  />
                  <LabeledField 
                    icon={<PhoneIcon fontSize="small" />}
                    label="Cell Number"
                    value={profile.cell_number}
                  />
                </Grid>
              </CardContent>
            </Card>
            
            <Card 
              elevation={1}
              sx={{ 
                borderRadius: 2,
                mb: 3
              }}
            >
              <Box sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Research & Talk
                </Typography>
              </Box>
              
              <CardContent sx={{ px: 3, py: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                    Research Interests
                  </Typography>
                  <Typography variant="body2">
                    {profile.research_interests || <Typography component="span" color="text.disabled">Not provided</Typography>}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                    Talk Title
                  </Typography>
                  <Typography variant="body2">
                    {profile.talk_title || <Typography component="span" color="text.disabled">Not provided</Typography>}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                    Abstract
                  </Typography>
                  <Typography variant="body2">
                    {profile.abstract || <Typography component="span" color="text.disabled">Not provided</Typography>}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Card 
              elevation={1}
              sx={{ 
                borderRadius: 2,
                mb: 3
              }}
            >
              <Box sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Visit Preferences
                </Typography>
              </Box>
              
              <CardContent sx={{ px: 3, py: 2 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventIcon fontSize="small" sx={{ mr: 1 }} />
                    Preferred Visit Dates
                  </Typography>
                  {profile.preferred_visit_dates && 
                  Array.isArray(profile.preferred_visit_dates) && 
                  profile.preferred_visit_dates.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      {profile.preferred_visit_dates.map((dateRange, index) => {
                        const formattedRange = formatDateRange(dateRange);
                        return formattedRange ? (
                          <Chip 
                            key={index}
                            label={`Option ${index + 1}: ${formattedRange}`}
                            color="info"
                            variant="outlined"
                            size="small"
                            icon={<TodayIcon />}
                            sx={{ 
                              borderRadius: 1,
                              width: 'fit-content'
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">No preferred dates provided</Typography>
                  )}
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                    Preferred Faculty
                  </Typography>
                  {profile.preferred_faculty && profile.preferred_faculty.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {profile.preferred_faculty.map((faculty, index) => (
                        <Chip 
                          key={index}
                          label={faculty}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">No preferred faculty provided</Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <FoodIcon fontSize="small" sx={{ mr: 1 }} />
                    Dietary Information
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={500}>Food Preferences:</Typography>
                      {profile.food_preferences && profile.food_preferences.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {profile.food_preferences.map((pref, index) => (
                            <Chip 
                              key={index}
                              label={pref}
                              size="small"
                              variant="outlined"
                              color="success"
                              sx={{ borderRadius: 1 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">None specified</Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={500}>Dietary Restrictions:</Typography>
                      {profile.dietary_restrictions && profile.dietary_restrictions.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {profile.dietary_restrictions.map((restriction, index) => (
                            <Chip 
                              key={index}
                              label={restriction}
                              size="small"
                              variant="outlined"
                              color="error"
                              sx={{ borderRadius: 1 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">None specified</Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
            
            <Card 
              elevation={1}
              sx={{ 
                borderRadius: 2
              }}
            >
              <Box sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Travel Information
                </Typography>
              </Box>
              
              <CardContent sx={{ px: 3, py: 2 }}>
                <Grid container spacing={3}>
                  <LabeledField 
                    icon={<FlightIcon fontSize="small" />}
                    label="Travel Assistance"
                    value={profile.travel_assistance}
                  />
                  <LabeledField 
                    icon={<LocationIcon fontSize="small" />}
                    label="Preferred Airport"
                    value={profile.preferred_airport}
                  />
                  <LabeledField 
                    icon={<PassportIcon fontSize="small" />}
                    label="Passport Name"
                    value={profile.passport_name}
                  />
                  <LabeledField 
                    icon={<TodayIcon fontSize="small" />}
                    label="Date of Birth"
                    value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null}
                  />
                  <LabeledField 
                    icon={<GenderIcon fontSize="small" />}
                    label="Gender"
                    value={profile.gender === 'other' ? profile.gender_custom : profile.gender}
                  />
                  <LabeledField 
                    icon={<PassportIcon fontSize="small" />}
                    label="Known Traveler Number"
                    value={profile.known_traveler_number}
                  />
                  <LabeledField 
                    icon={<FlightIcon fontSize="small" />}
                    label="Frequent Flyer Info"
                    value={profile.frequent_flyer_info}
                  />
                  <LabeledField 
                    icon={<LocationIcon fontSize="small" />}
                    label="Country of Residence" 
                    value={profile.country_of_residence}
                  />
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ 
            borderRadius: 1.5,
            textTransform: 'none',
            px: 3,
            fontWeight: 500
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidateProfileDialog;
