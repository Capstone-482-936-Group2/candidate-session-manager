import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Divider, 
  Alert, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText,
  Avatar,
  useTheme,
  alpha,
  Menu, 
  MenuItem, 
  ListItemIcon, 
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  CalendarMonth as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Commute as CommuteIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  HowToReg as RegisterIcon,
  DoNotDisturb as UnregisterIcon,
  Verified as VerifiedIcon,
  Group as GroupIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { seasonsAPI, timeSlotsAPI, candidateSectionsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const FacultyDashboard = () => {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [candidateSections, setCandidateSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [attendeesMenuAnchor, setAttendeesMenuAnchor] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setLoading(true);
        const seasonsResponse = await seasonsAPI.getSeasons();
        setSeasons(seasonsResponse.data);
      } catch (err) {
        console.error('Error fetching seasons:', err);
        setError('Failed to load recruiting seasons');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, []);

  const fetchCandidateSections = async (seasonId) => {
    try {
      setLoading(true);
      const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(seasonId);
      setCandidateSections(sectionsResponse.data);
      setSelectedSeason(seasons.find(season => season.id === seasonId));
    } catch (err) {
      console.error('Error fetching candidate sections:', err);
      setError('Failed to load candidate sections');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.registerForTimeSlot(timeSlotId);
      
      // Refresh candidate sections for the current season
      if (selectedSeason) {
        const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(selectedSeason.id);
        setCandidateSections(sectionsResponse.data);
      }
      
      setStatusMessage({
        text: 'Successfully registered for the time slot',
        severity: 'success'
      });
    } catch (err) {
      setStatusMessage({
        text: 'Failed to register for time slot',
        severity: 'error'
      });
      console.error(err);
    }
  };

  const handleUnregister = async (timeSlotId) => {
    try {
      await timeSlotsAPI.unregisterFromTimeSlot(timeSlotId);
      
      // Refresh candidate sections for the current season
      if (selectedSeason) {
        const sectionsResponse = await candidateSectionsAPI.getCandidateSectionsBySeason(selectedSeason.id);
        setCandidateSections(sectionsResponse.data);
      }
      
      setStatusMessage({
        text: 'Successfully unregistered from the time slot',
        severity: 'success'
      });
    } catch (err) {
      setStatusMessage({
        text: 'Failed to unregister from time slot',
        severity: 'error'
      });
      console.error(err);
    }
  };

  const isRegistered = (timeSlot) => {
    return timeSlot.attendees?.some(attendee => attendee?.user?.id === currentUser?.id) || false;
  };

  const handleOpenAttendeesMenu = (event, timeSlot) => {
    setAttendeesMenuAnchor(event.currentTarget);
    setSelectedTimeSlot(timeSlot);
  };

  const handleCloseAttendeesMenu = () => {
    setAttendeesMenuAnchor(null);
    setSelectedTimeSlot(null);
  };

  if (loading && !selectedSeason) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom color="primary.dark">
          Faculty Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your teaching sessions and candidate interactions
        </Typography>
      </Box>

      {statusMessage && (
        <Alert 
          severity={statusMessage.severity} 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            fontWeight: 500
          }} 
          onClose={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            fontWeight: 500
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {!selectedSeason ? (
        <>
          <Typography variant="h6" paragraph fontWeight={500} color="text.secondary">
            Select a recruiting season to view available candidate sections.
          </Typography>

          <Grid container spacing={3}>
            {seasons.map(season => (
              <Grid item xs={12} md={6} key={season.id}>
                <Card 
                  elevation={2}
                  sx={{ 
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: theme.shadows[6],
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <CalendarIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: '1.75rem' }} />
                    <Typography variant="h5" component="h2" fontWeight={600}>
                      {season.title}
                    </Typography>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="body1" paragraph>
                      {season.description || "No description available"}
                    </Typography>

                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      borderRadius: 1.5,
                      px: 2,
                      py: 1.5
                    }}>
                      <ScheduleIcon color="info" sx={{ mr: 1.5 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="info.dark">
                          Season Duration
                        </Typography>
                        <Typography variant="body2">
                          {season.start_date ? format(parseISO(season.start_date), 'MMM d, yyyy') : 'No start date'} - {season.end_date ? format(parseISO(season.end_date), 'MMM d, yyyy') : 'No end date'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Button 
                      variant="contained"
                      fullWidth 
                      onClick={() => fetchCandidateSections(season.id)}
                      sx={{ 
                        borderRadius: 2,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 500
                      }}
                    >
                      View Candidate Sections
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <>
          <Box sx={{ 
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}>
            <Button 
              onClick={() => setSelectedSeason(null)}
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Back to Seasons
            </Button>
            
            <Box>
              <Typography variant="h5" fontWeight={600} color="primary.dark">
                {selectedSeason.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {selectedSeason.start_date ? format(parseISO(selectedSeason.start_date), 'MMM d, yyyy') : 'No start date'} - {selectedSeason.end_date ? format(parseISO(selectedSeason.end_date), 'MMM d, yyyy') : 'No end date'}
              </Typography>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : candidateSections.length === 0 ? (
            <Paper 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                No Candidate Sections Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                There are no candidate sections available for registration at this time.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {candidateSections
                .filter(section => section.time_slots?.some(slot => Boolean(slot.is_visible)))
                .map(section => (
                  <Grid item xs={12} md={6} key={section.id}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease',
                        height: '100%',
                        '&:hover': {
                          boxShadow: theme.shadows[4]
                        }
                      }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Box sx={{ 
                          p: 3, 
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          bgcolor: alpha(theme.palette.primary.main, 0.03)
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main',
                                color: 'white',
                                fontWeight: 600,
                                mr: 2
                              }}
                            >
                              {section.candidate.first_name?.[0] || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight={600}>
                                {section.candidate.first_name} {section.candidate.last_name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmailIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {section.candidate.email}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {section.needs_transportation && (
                              <Chip 
                                icon={<CommuteIcon />}
                                label="Needs Transportation" 
                                color="secondary" 
                                size="small"
                                sx={{ borderRadius: 1.5 }}
                              />
                            )}
                            {section.arrival_date && (
                              <Chip 
                                label={`Arrives: ${section.arrival_date ? format(parseISO(section.arrival_date), 'MMM d, yyyy') : 'No arrival date'}`}
                                size="small"
                                color="info"
                                sx={{ borderRadius: 1.5 }}
                              />
                            )}
                            {section.leaving_date && (
                              <Chip 
                                label={`Leaves: ${section.leaving_date ? format(parseISO(section.leaving_date), 'MMM d, yyyy') : 'No leaving date'}`}
                                size="small"
                                color="info"
                                sx={{ borderRadius: 1.5 }}
                              />
                            )}
                          </Box>
                          
                          {section.description && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {section.description}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ p: 3 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Available Time Slots:
                          </Typography>

                          {section.time_slots && section.time_slots.length > 0 ? (
                            <List disablePadding>
                              {section.time_slots
                                .filter(slot => slot.is_visible !== false)
                                .map(slot => {
                                  const registered = isRegistered(slot);
                                  const isFull = slot.attendees?.length >= slot.max_attendees;
                                  
                                  return (
                                    <Paper
                                      key={slot.id}
                                      elevation={0}
                                      sx={{ 
                                        p: 2,
                                        mb: 2,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: registered ? 'secondary.main' : 'divider',
                                        bgcolor: registered ? alpha(theme.palette.secondary.main, 0.05) : 
                                                 isFull ? alpha(theme.palette.action.disabled, 0.1) : 'background.paper'
                                      }}
                                    >
                                      <Box sx={{ mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', mb: 1 }}>
                                          <Typography variant="subtitle2" fontWeight={600}>
                                            {format(parseISO(slot.start_time), 'MMM d, yyyy')}
                                          </Typography>
                                          <Box>
                                            {registered && (
                                              <Chip 
                                                size="small" 
                                                color="secondary" 
                                                icon={<VerifiedIcon />}
                                                label="Registered" 
                                                sx={{ borderRadius: 1 }}
                                              />
                                            )}
                                          </Box>
                                        </Box>
                                        
                                        <Typography variant="body2" color="text.secondary">
                                          {format(parseISO(slot.start_time), 'h:mm a')} - {slot.end_time ? format(parseISO(slot.end_time), 'h:mm a') : 'No end time'}
                                        </Typography>
                                        
                                        {slot.location && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                              {slot.location}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>

                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography variant="body2" color="text.secondary">
                                            {slot.attendees?.length || 0}/{slot.max_attendees} slots filled
                                          </Typography>
                                          {slot.attendees?.length > 0 && (
                                            <Tooltip title="View registered attendees">
                                              <IconButton 
                                                size="small" 
                                                onClick={(e) => handleOpenAttendeesMenu(e, slot)}
                                                sx={{ ml: 1 }}
                                              >
                                                <GroupIcon fontSize="small" />
                                                <ArrowDownIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                        </Box>
                                        
                                        {registered ? (
                                          <Button
                                            size="small"
                                            startIcon={<UnregisterIcon />}
                                            onClick={() => handleUnregister(slot.id)}
                                            color="error"
                                            variant="outlined"
                                            sx={{ 
                                              borderRadius: 1.5,
                                              textTransform: 'none'
                                            }}
                                          >
                                            Unregister
                                          </Button>
                                        ) : !isFull ? (
                                          <Button
                                            size="small"
                                            startIcon={<RegisterIcon />}
                                            onClick={() => handleRegister(slot.id)}
                                            color="primary"
                                            variant="contained"
                                            sx={{ 
                                              borderRadius: 1.5,
                                              textTransform: 'none'
                                            }}
                                          >
                                            Register
                                          </Button>
                                        ) : (
                                          <Button
                                            size="small"
                                            disabled
                                            sx={{ 
                                              borderRadius: 1.5,
                                              textTransform: 'none'
                                            }}
                                          >
                                            Full
                                          </Button>
                                        )}
                                      </Box>
                                    </Paper>
                                  );
                                })}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                              No time slots available for this candidate.
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </>
      )}

      {/* Attendees Menu */}
      <Menu
        anchorEl={attendeesMenuAnchor}
        open={Boolean(attendeesMenuAnchor)}
        onClose={handleCloseAttendeesMenu}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 250, maxWidth: 300, borderRadius: 2 }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Registered Attendees
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedTimeSlot && format(parseISO(selectedTimeSlot.start_time), 'MMM d, h:mm a')} 
          </Typography>
        </Box>
        
        {selectedTimeSlot && selectedTimeSlot.attendees?.length > 0 ? (
          selectedTimeSlot.attendees.map(attendee => (
            <MenuItem key={attendee.id}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={`${attendee.user?.first_name || ''} ${attendee.user?.last_name || ''}`} 
                secondary={attendee.user?.email || 'No email'} 
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <ListItemText primary="No attendees" />
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
};

export default FacultyDashboard;