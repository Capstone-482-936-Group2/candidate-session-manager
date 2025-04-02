import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, IconButton, Tabs, Tab, Divider, FormControl, InputLabel,
  Select, MenuItem, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { locationTypesAPI, locationsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

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
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>Location Management</Typography>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Location Types" />
          <Tab label="Locations" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => {
                setLocationTypeForm({ name: '', description: '' });
                setLocationTypeDialogOpen(true);
              }}
            >
              Add Location Type
            </Button>
          </Box>

          <Grid container spacing={3}>
            {locationTypes.map(locationType => (
              <Grid item xs={12} sm={6} md={4} key={locationType.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{locationType.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {locationType.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Total Locations: {locations.filter(loc => loc.location_type === locationType.id).length}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      onClick={() => {
                        setSelectedLocationType(locationType);
                        setLocationTypeForm({
                          name: locationType.name,
                          description: locationType.description || ''
                        });
                        setEditLocationTypeDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteLocationType(locationType.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tabValue === 1 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              startIcon={<AddIcon />}
              variant="contained"
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
            >
              Add Location
            </Button>
          </Box>

          {locationTypes.length === 0 ? (
            <Typography>Please add at least one location type before creating locations.</Typography>
          ) : (
            <Grid container spacing={3}>
              {locations.map(location => (
                <Grid item xs={12} sm={6} md={4} key={location.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{location.name}</Typography>
                      <Typography variant="subtitle2" color="primary">
                        Type: {locationTypes.find(t => t.id === location.location_type)?.name || 'Unknown'}
                      </Typography>
                      {location.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {location.description}
                        </Typography>
                      )}
                      {location.address && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Address: {location.address}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <IconButton 
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
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteLocation(location.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
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
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LocationManagement;
