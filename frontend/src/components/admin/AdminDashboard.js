import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import RecruitingSeasonManagement from './RecruitingSeasonManagement';
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

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin dashboard tabs"
        >
          <Tab label="Recruiting Seasons" />
          <Tab label="User Management" />
          <Tab label="Form Management" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <RecruitingSeasonManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <UserManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <FormManagement />
      </TabPanel>
    </Box>
  );
};

export default AdminDashboard;