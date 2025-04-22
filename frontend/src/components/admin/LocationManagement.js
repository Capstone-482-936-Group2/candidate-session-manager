import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, IconButton, Tabs, Tab, Divider, FormControl, InputLabel,
  Select, MenuItem, List, ListItem, ListItemText, ListItemSecondaryAction,
  CircularProgress, Paper
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { locationTypesAPI, locationsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme, alpha } from '@mui/material/styles';

const LocationManagement = () => {
  // State for location types
  const [locationTypes, setLocationTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [locationTypeDialogOpen, setLocationTypeDialogOpen] = useState(false);
  const [editLocationTypeDialogOpen, setEditLocationTypeDialogOpen] = useState(false);
  const [selectedLocationType, setSelectedLocationType] = useState(null);
  const [locationTypeForm, setLocationTypeForm] = useState({
    name: '',
    description: ''
  });
  
  // State for locations
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editLocationDialogOpen, setEditLocationDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    description: '',
    location_type: '',
    address: '',
    notes: ''
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { currentUser } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchLocationTypes();
    fetchLocations();
  }, []);

  const fetchLocationTypes = async () => {
    try {
      setLoading(true);
      const response = await locationTypesAPI.getLocationTypes();
      setLocationTypes(response.data);
    } catch (err) {
      console.error('Error fetching location types:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load location types',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getLocations();
      setLocations(response.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load locations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Location Type handlers
  const handleLocationTypeFormChange = (e) => {
    const { name, value } = e.target;
    setLocationTypeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateLocationType = async () => {
    try {
      await locationTypesAPI.createLocationType(locationTypeForm);
      fetchLocationTypes();
      setLocationTypeDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Location type created successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating location type:', err);
      setSnackbar({
        open: true,
        message: 'Failed to create location type',
        severity: 'error'
      });
    }
  };

  const handleUpdateLocationType = async () => {
    try {
      await locationTypesAPI.updateLocationType(selectedLocationType.id, locationTypeForm);
      fetchLocationTypes();
      setEditLocationTypeDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Location type updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating location type:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update location type',
        severity: 'error'
      });
    }
  };

  const handleDeleteLocationType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location type? All locations of this type will also be deleted.')) {
      return;
    }
    
    try {
      await locationTypesAPI.deleteLocationType(id);
      fetchLocationTypes();
      fetchLocations();
      setSnackbar({
        open: true,
        message: 'Location type deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting location type:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete location type',
        severity: 'error'
      });
    }
  };

  // Location handlers
  const handleLocationFormChange = (e) => {
    const { name, value } = e.target;
    setLocationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateLocation = async () => {
    try {
      await locationsAPI.createLocation(locationForm);
      fetchLocations();
      setLocationDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Location created successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating location:', err);
      setSnackbar({
        open: true,
        message: 'Failed to create location',
        severity: 'error'
      });
    }
  };

  const handleUpdateLocation = async () => {
    try {
      await locationsAPI.updateLocation(selectedLocation.id, locationForm);
      fetchLocations();
      setEditLocationDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Location updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating location:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update location',
        severity: 'error'
      });
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }
    
    try {
      await locationsAPI.deleteLocation(id);
      fetchLocations();
      setSnackbar({
        open: true,
        message: 'Location deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting location:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete location',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Box sx={{ 
        mb: 3, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.background.paper, 0.8)
      }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              py: 1.5
            },
            '& .Mui-selected': {
              fontWeight: 600,
              color: 'primary.main'
            }
          }}
        >
          <Tab label="Location Types" />
          <Tab label="Locations" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600} color="primary.dark">
              Location Types
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => {
                setLocationTypeForm({ name: '', description: '' });
                setLocationTypeDialogOpen(true);
              }}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                py: 1,
                px: 2,
                fontWeight: 500
              }}
            >
              Add Location Type
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : locationTypes.length === 0 ? (
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
                No Location Types Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create your first location type using the "Add Location Type" button.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {locationTypes.map(locationType => (
                <Grid item xs={12} md={6} key={locationType.id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
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
                      py: 2
                    }}>
                      <Typography variant="h6" fontWeight={600}>
                        {locationType.name}
                      </Typography>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {locationType.description || "No description available."}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography 
                          variant="subtitle2" 
                          fontWeight={600} 
                          color="primary.dark" 
                          gutterBottom
                        >
                          Associated Locations:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {locations.filter(loc => loc.location_type === locationType.id).length} location(s)
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ p: 2 }}>
                      <Button 
                        startIcon={<EditIcon />} 
                        onClick={() => {
                          setSelectedLocationType(locationType);
                          setLocationTypeForm({
                            name: locationType.name,
                            description: locationType.description || ''
                          });
                          setEditLocationTypeDialogOpen(true);
                        }}
                        sx={{ 
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontWeight: 500
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        startIcon={<DeleteIcon />} 
                        color="error"
                        onClick={() => handleDeleteLocationType(locationType.id)}
                        sx={{ 
                          ml: 1,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontWeight: 500
                        }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600} color="primary.dark">
              Locations
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => {
                setLocationForm({
                  name: '',
                  description: '',
                  location_type: locationTypes.length > 0 ? locationTypes[0].id : '',
                  address: '',
                  notes: ''
                });
                setLocationDialogOpen(true);
              }}
              disabled={locationTypes.length === 0}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                py: 1,
                px: 2,
                fontWeight: 500
              }}
            >
              Add Location
            </Button>
          </Box>

          {locationTypes.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                mb: 3
              }}
            >
              Please create at least one location type before adding locations.
            </Alert>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : locations.length === 0 ? (
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
                No Locations Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create your first location using the "Add Location" button.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {locations.map(location => (
                <Grid item xs={12} md={6} key={location.id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
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
                      py: 2
                    }}>
                      <Typography variant="h6" fontWeight={600}>
                        {location.name}
                      </Typography>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight={600} 
                        color="primary.dark" 
                        gutterBottom
                      >
                        Location Type:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {locationTypes.find(type => type.id === location.location_type)?.name || 'Unknown'}
                      </Typography>
                      
                      {location.description && (
                        <>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={600} 
                            color="primary.dark" 
                            gutterBottom
                          >
                            Description:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {location.description}
                          </Typography>
                        </>
                      )}
                      
                      {location.address && (
                        <>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={600} 
                            color="primary.dark" 
                            gutterBottom
                          >
                            Address:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {location.address}
                          </Typography>
                        </>
                      )}
                      
                      {location.notes && (
                        <>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={600} 
                            color="primary.dark" 
                            gutterBottom
                          >
                            Notes:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {location.notes}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ p: 2 }}>
                      <Button 
                        startIcon={<EditIcon />} 
                        onClick={() => {
                          setSelectedLocation(location);
                          setLocationForm({
                            name: location.name,
                            description: location.description || '',
                            location_type: location.location_type,
                            address: location.address || '',
                            notes: location.notes || ''
                          });
                          setEditLocationDialogOpen(true);
                        }}
                        sx={{ 
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontWeight: 500
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        startIcon={<DeleteIcon />} 
                        color="error"
                        onClick={() => handleDeleteLocation(location.id)}
                        sx={{ 
                          ml: 1,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontWeight: 500
                        }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Location Type Dialog */}
      <Dialog open={locationTypeDialogOpen} onClose={() => setLocationTypeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Location Type</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Type Name"
            value={locationTypeForm.name}
            onChange={handleLocationTypeFormChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            name="description"
            label="Description"
            value={locationTypeForm.description}
            onChange={handleLocationTypeFormChange}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationTypeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateLocationType} 
            variant="contained"
            disabled={!locationTypeForm.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Location Type Dialog */}
      <Dialog open={editLocationTypeDialogOpen} onClose={() => setEditLocationTypeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Location Type</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Type Name"
            value={locationTypeForm.name}
            onChange={handleLocationTypeFormChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            name="description"
            label="Description"
            value={locationTypeForm.description}
            onChange={handleLocationTypeFormChange}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLocationTypeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateLocationType} 
            variant="contained"
            disabled={!locationTypeForm.name}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Location</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Location Type</InputLabel>
            <Select
              name="location_type"
              value={locationForm.location_type}
              onChange={handleLocationFormChange}
              label="Location Type"
            >
              {locationTypes.map(type => (
                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="name"
            label="Location Name"
            value={locationForm.name}
            onChange={handleLocationFormChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            name="description"
            label="Description"
            value={locationForm.description}
            onChange={handleLocationFormChange}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
          <TextField
            name="address"
            label="Address"
            value={locationForm.address}
            onChange={handleLocationFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="notes"
            label="Notes"
            value={locationForm.notes}
            onChange={handleLocationFormChange}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateLocation} 
            variant="contained"
            disabled={!locationForm.name || !locationForm.location_type}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={editLocationDialogOpen} onClose={() => setEditLocationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Location</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Location Type</InputLabel>
            <Select
              name="location_type"
              value={locationForm.location_type}
              onChange={handleLocationFormChange}
              label="Location Type"
            >
              {locationTypes.map(type => (
                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="name"
            label="Location Name"
            value={locationForm.name}
            onChange={handleLocationFormChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            name="description"
            label="Description"
            value={locationForm.description}
            onChange={handleLocationFormChange}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
          <TextField
            name="address"
            label="Address"
            value={locationForm.address}
            onChange={handleLocationFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="notes"
            label="Notes"
            value={locationForm.notes}
            onChange={handleLocationFormChange}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLocationDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateLocation} 
            variant="contained"
            disabled={!locationForm.name || !locationForm.location_type}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationManagement;
