import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Tabs, Tab } from '@mui/material';
import UserManagement from './UserManagement';
import RecruitingSeasonManagement from './RecruitingSeasonManagement';
import TimeSlotTemplateManagement from './TimeSlotTemplateManagement';
import LocationManagement from './LocationManagement';
import { useLocation } from 'react-router-dom';
import UserManagement from './UserManagement';
import FormManagement from '../../pages/FormManagement';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // const navigationItems = [ ... ];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin dashboard tabs"
        >
          <Tab label="User Management" />
          <Tab label="Season Management" />
          <Tab label="Time Slot Templates" />
          <Tab label="Locations" />
          <Tab label="Form Management" />
        </Tabs>
      </Paper>
      
      <Box sx={{ py: 2 }}>
        {tabValue === 0 && <UserManagement />}
        {tabValue === 1 && <RecruitingSeasonManagement />}
        {tabValue === 2 && <TimeSlotTemplateManagement />}
        {tabValue === 3 && <LocationManagement />}
        {tabValue === 4 && <FormManagement />}
      </Box>
    </Container>
  );
};

export default AdminDashboard;