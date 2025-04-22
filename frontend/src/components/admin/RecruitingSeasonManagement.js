import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  TextField, 
  Box, 
  Card, 
  CardContent, 
  CardActions, 
  Divider,
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Snackbar, 
  Alert,
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  DateRange as DateRangeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { seasonsAPI, candidateSectionsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const RecruitingSeasonManagement = () => {
  const [seasons, setSeasons] = useState([]);
  const [candidateSections, setCandidateSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const theme = useTheme();

  // Form states
  const [seasonForm, setSeasonForm] = useState({
    title: '',
    description: '',
    start_date: new Date(),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)) // Default to 3 months duration
  });

  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First, get all recruiting seasons
        console.log('Fetching all recruiting seasons');
        const seasonsResponse = await seasonsAPI.getSeasons();
        setSeasons(seasonsResponse.data);
        
        // Get all candidate sections in one call to minimize API requests
        console.log('Fetching all candidate sections');
        const allSectionsResponse = await candidateSectionsAPI.getCandidateSections();
        console.log('All sections response:', allSectionsResponse.data);
        
        // Group sections by season
        const allSections = [];
        
        for (const season of seasonsResponse.data) {
          console.log(`Processing sections for season ID: ${season.id}`);
          
          // Filter sections for this season
          const seasonSections = allSectionsResponse.data.filter(section => {
            const sectionSessionId = 
              (section.session && typeof section.session === 'object') ? section.session.id : 
              (section.session) ? parseInt(section.session) :
              (section.season && typeof section.season === 'object') ? section.season.id :
              parseInt(section.season || 0);
            
            return sectionSessionId === season.id;
          });
          
          // Process sections to ensure they have the correct season ID reference
          const processedSections = seasonSections.map(section => ({
            ...section,
            // Ensure we have a consistent session field with the right ID
            session: typeof section.session === 'object' ? section.session : { id: season.id },
            // Add seasonId field for explicit tracking
            seasonId: season.id
          }));
          
          console.log(`Found ${processedSections.length} sections for season ${season.id}`);
          allSections.push(...processedSections);
        }
        
        console.log('All sections with explicit season IDs:', allSections);
        setCandidateSections(allSections);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load recruiting seasons data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Reset form
    setSeasonForm({
      title: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 3))
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSeasonForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setSeasonForm(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleCreateSeason = async () => {
    try {
      // Format dates without timezone adjustment (YYYY-MM-DD format)
      const formattedStartDate = format(seasonForm.start_date, 'yyyy-MM-dd', { timeZone: 'UTC' });
      const formattedEndDate = format(seasonForm.end_date, 'yyyy-MM-dd', { timeZone: 'UTC' });
      
      // Create new recruiting season with properly formatted dates
      const seasonData = {
        title: seasonForm.title,
        description: seasonForm.description || '',
        start_date: formattedStartDate,
        end_date: formattedEndDate
      };
      
      console.log('Sending season data:', seasonData);
      const response = await seasonsAPI.createSeason(seasonData);
      
      // Update the seasons list
      setSeasons(prev => [...prev, response.data]);
      
      // Close the dialog and show success message
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Recruiting season created successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating recruiting season:', err);
      
      // Extract detailed error message from response
      const errorDetail = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : err.message);
      
      setSnackbar({
        open: true,
        message: 'Failed to create recruiting season: ' + errorDetail,
        severity: 'error'
      });
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    if (!window.confirm('Are you sure you want to delete this recruiting season? This will delete all associated candidate sections, time slots, and registrations. This action cannot be undone.')) {
      return;
    }
    
    try {
      await seasonsAPI.deleteSeason(seasonId);
      
      // Update the seasons list
      setSeasons(prev => prev.filter(season => season.id !== seasonId));
      
      setSnackbar({
        open: true,
        message: 'Recruiting season deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting recruiting season:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete recruiting season',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper function to count candidate sections for a season
  const getCandidateSectionCount = (seasonId) => {
    // Now we can rely on the explicit seasonId field we added
    return candidateSections.filter(section => {
      // First check the explicit seasonId field we added
      if (section.seasonId) {
        return section.seasonId === seasonId;
      }
      
      // Fallback to checking other fields if seasonId is not present
      const sectionSeasonId = 
        (section.session && typeof section.session === 'object') ? section.session.id : 
        (section.session) ? section.session :
        (section.season && typeof section.season === 'object') ? section.season.id :
        section.season;
        
      return sectionSeasonId === seasonId;
    }).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: 2,
          mt: 2,
          mb: 2
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600} color="primary.dark">
            Recruiting Seasons
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 2,
              py: 1,
              fontWeight: 500
            }}
          >
            Add New Season
          </Button>
        </Box>
        
        {seasons.length === 0 ? (
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
              No Recruiting Seasons
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create your first recruiting season using the "Add New Season" button.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ 
                mt: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Create Season
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {seasons.map(season => {
              const candidateCount = getCandidateSectionCount(season.id);
              return (
                <Grid item xs={12} sm={6} md={4} key={season.id}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      borderRadius: 2,
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      px: 3,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <CalendarIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: '1.75rem' }} />
                      <Typography variant="h6" component="h2" fontWeight={600} sx={{ flexGrow: 1 }}>
                        {season.title}
                      </Typography>
                      <Tooltip title="Delete Season">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSeason(season.id)}
                          sx={{ 
                            ml: 1,
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {season.description || "No description provided."}
                      </Typography>
                      
                      <Box sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        borderRadius: 1.5,
                        p: 1.5,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <DateRangeIcon color="info" sx={{ mr: 1.5 }} />
                        <Box>
                          <Typography variant="caption" fontWeight={600} color="info.dark">
                            SEASON DURATION
                          </Typography>
                          <Typography variant="body2">
                            {season.start_date ? format(parseISO(season.start_date), 'MMM d, yyyy') : 'No start date'} - 
                            {season.end_date ? format(parseISO(season.end_date), 'MMM d, yyyy') : 'No end date'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {candidateCount} {candidateCount === 1 ? 'Candidate' : 'Candidates'}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ p: 2 }}>
                      <Button
                        component={Link}
                        to={`/admin-dashboard/season/${season.id}/candidates`}
                        variant="contained"
                        fullWidth
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500,
                          py: 1
                        }}
                      >
                        Manage Candidates
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
        
        {/* Add Season Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" fontWeight={600}>
              Add New Season
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 3 }}>
            <TextField
              label="Season Title"
              name="title"
              value={seasonForm.title}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Description"
              name="description"
              value={seasonForm.description}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <DatePicker
                label="Start Date"
                value={seasonForm.start_date}
                onChange={(date) => handleDateChange('start_date', date)}
                renderInput={(params) => 
                  <TextField {...params} fullWidth margin="normal" required />
                }
              />
              
              <DatePicker
                label="End Date"
                value={seasonForm.end_date}
                onChange={(date) => handleDateChange('end_date', date)}
                renderInput={(params) => 
                  <TextField {...params} fullWidth margin="normal" required />
                }
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSeason}
              variant="contained"
              sx={{ 
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Create Season
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default RecruitingSeasonManagement; 