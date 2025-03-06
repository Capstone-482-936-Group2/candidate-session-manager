import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Tabs, Tab } from '@mui/material';
import UserManagement from './UserManagement';
import RecruitingSeasonManagement from './RecruitingSeasonManagement';
import { useLocation } from 'react-router-dom';

const AdminDashboard = () => {
  const location = useLocation();
  const defaultTab = location.state?.defaultTab ?? 0;
  const [tabValue, setTabValue] = useState(defaultTab);

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
          <Tab label="Season Management" />
        </Tabs>
      </Paper>
      
      <Box sx={{ py: 2 }}>
        {tabValue === 0 && <UserManagement />}
        {tabValue === 1 && <RecruitingSeasonManagement />}
      </Box>
    </Container>
  );
};

export default AdminDashboard;