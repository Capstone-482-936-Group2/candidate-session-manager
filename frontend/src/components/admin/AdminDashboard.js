import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Tabs, 
  Tab, 
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { 
  PeopleAlt as PeopleIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Description as FormIcon
} from '@mui/icons-material';
import UserManagement from './UserManagement';
import RecruitingSeasonManagement from './RecruitingSeasonManagement';
import TimeSlotTemplateManagement from './TimeSlotTemplateManagement';
import LocationManagement from './LocationManagement';
import { useLocation } from 'react-router-dom';
import FormManagement from '../../pages/FormManagement';
import S3Test from '../tests/S3Test';

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
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom color="primary.dark">
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, seasons, time slots, locations, and forms
        </Typography>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="admin dashboard tabs"
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              py: 1.5,
              px: 3,
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.95rem',
              minHeight: 64
            },
            '& .Mui-selected': {
              fontWeight: 600,
              color: 'primary.main'
            },
            '& .MuiTabs-indicator': {
              height: 3
            }
          }}
        >
          <Tab 
            label="User Management" 
            icon={<PeopleIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Season Management" 
            icon={<CalendarIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Time Slot Templates" 
            icon={<ScheduleIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Locations" 
            icon={<LocationIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Form Management" 
            icon={<FormIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <UserManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <RecruitingSeasonManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <TimeSlotTemplateManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <LocationManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <FormManagement />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;