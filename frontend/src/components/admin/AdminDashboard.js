/**
 * Admin Dashboard component.
 * Provides a centralized interface for administrators to manage all aspects of the
 * candidate session system through a tabbed interface.
 */
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

/**
 * TabPanel component for displaying tab content.
 * Controls visibility of content based on selected tab index.
 * 
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Content to display in the tab panel
 * @param {number} props.value - Current selected tab value
 * @param {number} props.index - This panel's index value
 */
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

/**
 * AdminDashboard component.
 * Provides a tabbed interface for administrators to access different management sections:
 * - User Management: Add, edit, and delete users
 * - Season Management: Configure recruiting seasons
 * - Time Slot Templates: Create reusable time slot patterns
 * - Locations: Manage physical and virtual meeting locations
 * - Form Management: Create and configure forms for data collection
 * 
 * @returns {JSX.Element} The admin dashboard component
 */
const AdminDashboard = () => {
  // State to track the currently selected tab
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  /**
   * Handle tab change events.
   * Updates the selected tab state when a user clicks on a different tab.
   * 
   * @param {object} event - The event object
   * @param {number} newValue - The index of the newly selected tab
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Dashboard header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom color="primary.dark">
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, seasons, time slots, locations, and forms
        </Typography>
      </Box>
      
      {/* Main dashboard content */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4
        }}
      >
        {/* Tab navigation */}
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
          {/* User Management Tab */}
          <Tab 
            label="User Management" 
            icon={<PeopleIcon />} 
            iconPosition="start"
          />
          {/* Season Management Tab */}
          <Tab 
            label="Season Management" 
            icon={<CalendarIcon />} 
            iconPosition="start"
          />
          {/* Time Slot Templates Tab */}
          <Tab 
            label="Time Slot Templates" 
            icon={<ScheduleIcon />} 
            iconPosition="start"
          />
          {/* Locations Tab */}
          <Tab 
            label="Locations" 
            icon={<LocationIcon />} 
            iconPosition="start"
          />
          {/* Form Management Tab */}
          <Tab 
            label="Form Management" 
            icon={<FormIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        {/* Tab content panels */}
        <Box sx={{ p: 3 }}>
          {/* User Management Panel */}
          <TabPanel value={tabValue} index={0}>
            <UserManagement />
          </TabPanel>
          {/* Season Management Panel */}
          <TabPanel value={tabValue} index={1}>
            <RecruitingSeasonManagement />
          </TabPanel>
          {/* Time Slot Templates Panel */}
          <TabPanel value={tabValue} index={2}>
            <TimeSlotTemplateManagement />
          </TabPanel>
          {/* Locations Panel */}
          <TabPanel value={tabValue} index={3}>
            <LocationManagement />
          </TabPanel>
          {/* Form Management Panel */}
          <TabPanel value={tabValue} index={4}>
            <FormManagement />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;