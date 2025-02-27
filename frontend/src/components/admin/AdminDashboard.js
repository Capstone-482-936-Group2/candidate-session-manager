import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Tabs, Tab } from '@mui/material';
import UserManagement from './UserManagement';
import SessionManagement from './SessionManagement';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="User Management" />
          <Tab label="Session Management" />
        </Tabs>
      </Paper>
      
      <Box sx={{ py: 2 }}>
        {tabValue === 0 && <UserManagement />}
        {tabValue === 1 && <SessionManagement />}
      </Box>
    </Container>
  );
};

export default AdminDashboard;