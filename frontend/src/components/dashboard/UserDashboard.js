/**
 * User dashboard component that serves as the main landing page after login.
 * Displays quick access links and recent user activity.
 */
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * UserDashboard component displays a welcoming interface with quick access links
 * and a section for recent user activity.
 * 
 * @returns {React.ReactNode} Dashboard layout with actions and activity sections
 */
const UserDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Your Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Actions Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              {/* Forms Navigation Link */}
              <ListItem
                button
                component={RouterLink}
                to="/forms"
                sx={{ mb: 1 }}
              >
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary="View Forms"
                  secondary="Fill out forms assigned to you"
                />
              </ListItem>
              
              {/* Profile Navigation Link */}
              <ListItem
                button
                component={RouterLink}
                to="/profile"
                sx={{ mb: 1 }}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="View Profile"
                  secondary="Update your personal information"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText
                  primary="No recent activity"
                  secondary="Your recent actions will appear here"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard; 