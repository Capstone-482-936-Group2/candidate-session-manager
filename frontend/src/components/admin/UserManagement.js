import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, Select, MenuItem, TextField,
  Snackbar, Alert, Box, IconButton
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { usersAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

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
  });

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
      });
    } else {
      setSelectedUser(null);
      setNewRole('candidate');
      setFormData({
        email: '',
        user_type: 'candidate',
        first_name: '',
        last_name: '',
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

  if (loading) return <Typography>Loading users...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Add New User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.user_type}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(user)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              margin="normal"
              required
              disabled={!!selectedUser}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.user_type}
                onChange={(e) =>
                  setFormData({ ...formData, user_type: e.target.value })
                }
                label="Role"
              >
                <MenuItem value="candidate">Candidate</MenuItem>
                <MenuItem value="faculty">Faculty</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                {isSuperAdmin && <MenuItem value="superadmin">Super Admin</MenuItem>}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="First Name"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedUser ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography paragraph sx={{ mt: 2 }}>
            Are you sure you want to delete the user <strong>{selectedUser?.username}</strong>?
          </Typography>
          <Typography color="error">
            This action cannot be undone. All data associated with this user will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;