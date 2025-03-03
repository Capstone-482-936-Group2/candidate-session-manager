import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Grid, Button, TextField, 
  Box, Card, CardContent, CardActions, Divider,
  Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add as AddIcon, Delete as DeleteIcon, People as PeopleIcon } from '@mui/icons-material';
import { format } from 'date-fns';
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
      // Format dates correctly for the backend (YYYY-MM-DD format)
      const formattedStartDate = format(seasonForm.start_date, 'yyyy-MM-dd');
      const formattedEndDate = format(seasonForm.end_date, 'yyyy-MM-dd');
      
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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading recruiting seasons...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Recruiting Season Management</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add New Season
          </Button>
        </Box>
        
        {seasons.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">No Recruiting Seasons</Typography>
            <Typography variant="body2" color="textSecondary">
              Create your first recruiting season using the "Add New Season" button.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {seasons.map(season => (
              <Grid item xs={12} md={6} key={season.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h5">{season.title}</Typography>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                      {format(new Date(season.start_date), 'MMM d, yyyy')} - {format(new Date(season.end_date), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {season.description}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1 }} />
                      <Typography>
                        {getCandidateSectionCount(season.id)} Candidate Section{getCandidateSectionCount(season.id) !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link} 
                      to={`/admin-dashboard/season/${season.id}/candidates`}
                    >
                      Manage Candidates
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteSeason(season.id)}
                    >
                      Delete Season
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Add Season Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Add New Recruiting Season</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Title"
                  fullWidth
                  value={seasonForm.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Fall 2025 Faculty Recruitment"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={seasonForm.description}
                  onChange={handleFormChange}
                  placeholder="Provide details about this recruiting season"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={seasonForm.start_date}
                  onChange={(newValue) => handleDateChange('start_date', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={seasonForm.end_date}
                  onChange={(newValue) => handleDateChange('end_date', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  minDate={seasonForm.start_date}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleCreateSeason} 
              variant="contained"
              disabled={!seasonForm.title || !seasonForm.start_date || !seasonForm.end_date}
            >
              Create Season
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default RecruitingSeasonManagement; 