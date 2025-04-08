import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Checkbox,
  Grid,
  Switch,
  FormControlLabel,
  FormHelperText,
  Autocomplete,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import api, { usersAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import FormSubmissions from '../components/admin/FormSubmissions';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'date', label: 'Date' },
  { value: 'date_range', label: 'Date Range' },
];

const FormManagement = () => {
  const { currentUser, isAdmin } = useAuth();
  const [forms, setForms] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSendLinkDialog, setOpenSendLinkDialog] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    form_fields: [],
    assigned_to_ids: [],
    is_active: true,
  });
  const [selectedFormForSubmissions, setSelectedFormForSubmissions] = useState(null);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);

  useEffect(() => {
    fetchForms();
    if (isAdmin) {
      fetchUsers();
    }
  }, [currentUser, isAdmin]);

  const fetchForms = async () => {
    try {
      const response = await api.get('/forms/');
      setForms(response.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEditForm = (form) => {
    setEditingForm(form);
    setFormData({
      title: form.title,
      description: form.description,
      form_fields: form.form_fields || [],
      assigned_to_ids: form.assigned_to ? form.assigned_to.map(user => user.id) : [],
      is_active: form.is_active,
    });
    setOpenDialog(true);
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await api.delete(`/forms/${formId}/`);
        fetchForms();
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    }
  };

  const handleSendFormLink = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      // Send emails to each selected user
      const emailPromises = selectedUsers.map(user => 
        usersAPI.sendFormLink(selectedForm.id, user.email, message)
      );

      await Promise.all(emailPromises);

      setSuccess(`Form link sent successfully to ${selectedUsers.length} user(s)!`);
      setSelectedUsers([]);
      setMessage('');
      setTimeout(() => {
        setOpenSendLinkDialog(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending form link:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      setError(err.response?.data?.error || 'Failed to send form link');
    }
  };

  const handleToggleUser = (user) => {
    const currentIndex = selectedUsers.findIndex(u => u.id === user.id);
    const newSelectedUsers = [...selectedUsers];

    if (currentIndex === -1) {
      newSelectedUsers.push(user);
    } else {
      newSelectedUsers.splice(currentIndex, 1);
    }

    setSelectedUsers(newSelectedUsers);
  };

  const handleOpenSendLinkDialog = (form) => {
    setSelectedForm(form);
    // Prepopulate the message with a template
    setMessage(`Hello,

You have been invited to complete the form "${form.title}".

Please click the link below to access the form. You will need to sign in with your Google account to proceed.

Best regards,
${currentUser?.first_name} ${currentUser?.last_name}  
${currentUser?.email}`);
    setOpenSendLinkDialog(true);
  };

  const handleViewSubmissions = (form) => {
    setSelectedFormForSubmissions(form);
    setSubmissionsDialogOpen(true);
  };

  const handleCloseSubmissionsDialog = () => {
    setSubmissionsDialogOpen(false);
    setSelectedFormForSubmissions(null);
  };

  const handleAddField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
      help_text: '',
      options: []
    };
    setFormData(prev => ({
      ...prev,
      form_fields: [...prev.form_fields, newField]
    }));
  };

  const handleFieldChange = (fieldId, field, value) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(f => 
        f.id === fieldId ? { ...f, [field]: value } : f
      )
    }));
  };

  const handleAddOption = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(field => 
        field.id === fieldId
          ? { ...field, options: [...field.options, { id: `option_${Date.now()}`, label: '' }] }
          : field
      )
    }));
  };

  const handleOptionChange = (fieldId, optionId, value) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(field => 
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map(opt =>
                opt.id === optionId ? { ...opt, label: value } : opt
              )
            }
          : field
      )
    }));
  };

  const handleDeleteOption = (fieldId, optionId) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map(field => 
        field.id === fieldId
          ? { ...field, options: field.options.filter(opt => opt.id !== optionId) }
          : field
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form data
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    // Ensure form_fields array exists
    if (!formData.form_fields) {
      formData.form_fields = [];
    }

    // Validate each field
    for (const field of formData.form_fields) {
      if (!field.label) {
        setError('All fields must have a label');
        return;
      }
      if (!field.type) {
        setError('All fields must have a type');
        return;
      }
      if (['select', 'radio', 'checkbox'].includes(field.type) && (!field.options || field.options.length === 0)) {
        setError(`${field.label} must have at least one option`);
        return;
      }
    }

    try {
      if (editingForm) {
        await api.put(`/forms/${editingForm.id}/`, formData);
        setSuccess('Form updated successfully');
      } else {
        await api.post('/forms/', formData);
        setSuccess('Form created successfully');
      }
      setOpenDialog(false);
      fetchForms();
    } catch (err) {
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Failed to save form';
      setError(errorMessage);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Form Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingForm(null);
            setFormData({
              title: '',
              description: '',
              form_fields: [],
              assigned_to_ids: [],
              is_active: true,
            });
            setOpenDialog(true);
          }}
        >
          Create New Form
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms.map((form) => (
              <TableRow key={form.id}>
                <TableCell>{form.title}</TableCell>
                <TableCell>{form.description}</TableCell>
                <TableCell>
                  {form.assigned_to && form.assigned_to.map((user) => (
                    <Chip
                      key={user.id}
                      label={user.email}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Chip
                    label={form.is_active ? 'Active' : 'Inactive'}
                    color={form.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleViewSubmissions(form)}
                    title="View Submissions"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditForm(form)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteForm(form.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                  {isAdmin && (
                    <IconButton 
                      color="secondary" 
                      onClick={() => handleOpenSendLinkDialog(form)}
                      aria-label="send form link"
                    >
                      <EmailIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingForm ? 'Edit Form' : 'Create New Form'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.value })
                }
                label="Status"
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
            
            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => option.email}
              value={users.filter(user => formData.assigned_to_ids.includes(user.id))}
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  assigned_to_ids: newValue.map(user => user.id),
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign To Users"
                  margin="normal"
                />
              )}
              sx={{ mt: 2 }}
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Form Fields
            </Typography>
            
            {formData.form_fields.map((field) => (
              <Paper key={field.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Field Label"
                      value={field.label}
                      onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Field Type</InputLabel>
                      <Select
                        value={field.type}
                        onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                        label="Field Type"
                      >
                        {FIELD_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Help Text"
                      value={field.help_text}
                      onChange={(e) => handleFieldChange(field.id, 'help_text', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.required}
                          onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                        />
                      }
                      label="Required"
                    />
                  </Grid>
                  
                  {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Options
                      </Typography>
                      {field.options.map((option) => (
                        <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={option.label}
                            onChange={(e) => handleOptionChange(field.id, option.id, e.target.value)}
                            placeholder="Option label"
                          />
                          <IconButton
                            onClick={() => handleDeleteOption(field.id, option.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOption(field.id)}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddField}
              sx={{ mb: 2 }}
            >
              Add Field
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingForm ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Form Link Dialog */}
      <Dialog open={openSendLinkDialog} onClose={() => setOpenSendLinkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Form Link to Users</DialogTitle>
        <form onSubmit={handleSendFormLink}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Form: <strong>{selectedForm?.title}</strong>
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select Users:
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <List>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <ListItem 
                      button 
                      onClick={() => handleToggleUser(user)}
                      selected={selectedUsers.some(u => u.id === user.id)}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedUsers.some(u => u.id === user.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={user.full_name || user.email} 
                        secondary={user.email}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Users ({selectedUsers.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsers.map((user) => (
                  <Chip 
                    key={user.id} 
                    label={user.full_name || user.email} 
                    onDelete={() => handleToggleUser(user)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a personalized message for the users..."
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSendLinkDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={selectedUsers.length === 0}
            >
              Send Link to {selectedUsers.length} User(s)
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog
        open={submissionsDialogOpen}
        onClose={handleCloseSubmissionsDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Form Submissions - {selectedFormForSubmissions?.title}
        </DialogTitle>
        <DialogContent>
          {selectedFormForSubmissions && (
            <FormSubmissions formId={selectedFormForSubmissions.id} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubmissionsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FormManagement; 