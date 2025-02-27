import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { currentUser, isFaculty, isAdmin } = useAuth();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {currentUser?.first_name || currentUser?.username}!
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Sessions
          </Typography>
          <Typography paragraph>
            View and manage your session registrations.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/sessions"
          >
            View Sessions
          </Button>
        </Paper>
        
        {isFaculty && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Faculty Dashboard
            </Typography>
            <Typography paragraph>
              Manage candidate sessions and view your registrations.
            </Typography>
            <Button 
              variant="contained" 
              component={Link} 
              to="/faculty-dashboard"
            >
              Go to Faculty Dashboard
            </Button>
          </Paper>
        )}
        
        {isAdmin && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography paragraph>
              Manage users, create sessions, and view all data.
            </Typography>
            <Button 
              variant="contained" 
              component={Link} 
              to="/admin-dashboard"
            >
              Go to Admin Dashboard
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;