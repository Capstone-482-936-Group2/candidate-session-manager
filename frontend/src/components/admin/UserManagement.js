import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, Select, MenuItem, TextField,
  Snackbar, Alert, Box, IconButton, Chip, Tooltip, useTheme, alpha, Avatar, Divider, Grid, CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Visibility as VisibilityIcon, PersonAdd as PersonAddIcon, AdminPanelSettings as AdminIcon, School as FacultyIcon, Person as CandidateIcon } from '@mui/icons-material';
import { usersAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import CandidateProfileDialog from './CandidateProfileDialog';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { currentUser, isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    user_type: 'candidate',
    first_name: '',
    last_name: '',
    room_number: '',
  });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setNewRole(user.user_type);
      setFormData({
        email: user.email,
        user_type: user.user_type,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        room_number: user.room_number || '',
      });
    } else {
      setSelectedUser(null);
      setNewRole('candidate');
      setFormData({
        email: '',
        user_type: 'candidate',
        first_name: '',
        last_name: '',
        room_number: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      user_type: 'candidate',
      first_name: '',
      last_name: '',
      room_number: '',
    });
  };

  const handleRoleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || newRole === selectedUser.user_type) {
      handleCloseDialog();
      return;
    }

    try {
      await usersAPI.updateUserRole(selectedUser.id, newRole);
      // Refresh users data
      await fetchUsers();
      setSnackbar({
        open: true, 
        message: `Successfully updated role for ${selectedUser.username}`, 
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true, 
        message: err.response?.data?.error || 'Failed to update user role', 
        severity: 'error'
      });
    } finally {
      handleCloseDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      handleCloseDeleteDialog();
      return;
    }

    try {
      await usersAPI.deleteUser(selectedUser.id);
      // Refresh users data
      await fetchUsers();
      setSnackbar({
        open: true,
        message: `Successfully deleted user ${selectedUser.username}`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to delete user',
        severity: 'error'
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSnackbar({ ...snackbar, open: false });

    try {
      if (selectedUser) {
        await usersAPI.updateUser(selectedUser.id, formData);
        setSnackbar({
          open: true,
          message: 'User updated successfully',
          severity: 'success'
        });
      } else {
        // When creating a new user, include only necessary fields
        const userData = {
          ...formData,
          username: formData.email, // Use email as username
          user_type: formData.user_type || 'candidate' // Ensure user_type is set
        };
        await usersAPI.addUser(userData);
        setSnackbar({
          open: true,
          message: 'User added successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      const errorMessage = err.response?.data?.error || 
                          (err.response?.data && Object.values(err.response.data).join(', ')) || 
                          'Failed to save user';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Separate users into candidates and staff
  const candidates = users.filter(user => user.user_type === 'candidate');
  const staff = users.filter(user => user.user_type !== 'candidate');

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setProfileDialogOpen(true);
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
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3
      }}>
        <Typography variant="h5" fontWeight={600} color="primary.dark">
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 2,
            py: 1
          }}
        >
          Add New User
        </Button>
      </Box>

      {/* Staff Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ ml: 1 }}>
          Staff Members
        </Typography>
        <TableContainer 
          component={Paper} 
          elevation={2}
          sx={{ 
            mb: 4,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Room Number</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((user) => (
                <TableRow 
                  key={user.id}
                  sx={{ 
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                  }}
                >
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`}</TableCell>
                  <TableCell>
                    <Chip 
                      icon={user.user_type === 'admin' ? <AdminIcon /> : <FacultyIcon />}
                      label={user.user_type}
                      color={user.user_type === 'admin' ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        borderRadius: 1.5
                      }}
                    />
                  </TableCell>
                  <TableCell>{user.room_number}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton 
                        onClick={() => handleOpenDialog(user)}
                        size="small"
                        sx={{ 
                          mr: 1,
                          color: 'primary.main',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton 
                        onClick={() => handleDeleteClick(user)}
                        size="small"
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No staff members found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Candidates Table */}
      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ ml: 1 }}>
          Candidates
        </Typography>
        <TableContainer 
          component={Paper} 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Profile</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates.map((user) => (
                <TableRow 
                  key={user.id}
                  sx={{ 
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                  }}
                >
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`}</TableCell>
                  <TableCell>
                    <Tooltip title={user.candidate_profile && user.has_completed_setup 
                      ? "View candidate profile" 
                      : "Candidate has not completed their setup"}>
                      <span>
                        <Button
                          variant="text"
                          color="primary"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewProfile(user)}
                          disabled={!user.candidate_profile || !user.has_completed_setup}
                          sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            ...((!user.candidate_profile || !user.has_completed_setup) && {
                              color: 'text.disabled',
                              '& .MuiSvgIcon-root': {
                                color: 'text.disabled'
                              }
                            })
                          }}
                        >
                          {user.candidate_profile && user.has_completed_setup 
                            ? "View Profile" 
                            : "Profile Not Complete"}
                        </Button>
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton 
                        onClick={() => handleOpenDialog(user)}
                        size="small"
                        sx={{ 
                          mr: 1,
                          color: 'primary.main',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton 
                        onClick={() => handleDeleteClick(user)}
                        size="small"
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {candidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No candidates found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add/Edit User Dialog */}
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
            {selectedUser ? 'Edit User' : 'Add New User'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  margin="normal"
                  required
                  type="email"
                  sx={{ mt: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  fullWidth
                  margin="normal"
                  sx={{ mt: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  fullWidth
                  margin="normal"
                  sx={{ mt: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" sx={{ mt: 0 }}>
                  <InputLabel>User Type</InputLabel>
                  <Select
                    name="user_type"
                    value={formData.user_type}
                    onChange={(e) => {
                      const newUserType = e.target.value;
                      setFormData({ 
                        ...formData, 
                        user_type: newUserType,
                        room_number: newUserType === 'candidate' ? '' : formData.room_number
                      });
                    }}
                    label="User Type"
                  >
                    <MenuItem value="candidate">Candidate</MenuItem>
                    <MenuItem value="faculty">Faculty</MenuItem>
                    {isSuperAdmin && <MenuItem value="admin">Admin</MenuItem>}
                  </Select>
                </FormControl>
              </Grid>
              {formData.user_type !== 'candidate' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Room Number"
                    name="room_number"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    fullWidth
                    margin="normal"
                    sx={{ mt: 0 }}
                  />
                </Grid>
              )}
            </Grid>
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
              type="submit" 
              variant="contained"
              sx={{ 
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              {selectedUser ? 'Save Changes' : 'Add User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          color: 'error.main',
          fontWeight: 600
        }}>
          Delete User
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user <strong>{selectedUser?.email}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error"
            variant="contained"
            sx={{ 
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Candidate Profile Dialog */}
      <CandidateProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        candidate={selectedCandidate}
      />

      {/* Snackbar for notifications */}
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
  );
};

export default UserManagement;