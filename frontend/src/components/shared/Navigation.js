/**
 * Main navigation bar component for the application.
 * Displays different navigation options based on user role and authentication status.
 * Handles user menu, active route highlighting, and logout functionality.
 */
import React from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Container,
  Divider
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountCircle } from '@mui/icons-material';

/**
 * Navigation component renders the app header with navigation links and user menu.
 * Shows different navigation options based on user role (admin, faculty, candidate).
 * Displays login button for unauthenticated users and user menu for authenticated users.
 * 
 * @returns {React.ReactNode} Application navigation bar
 */
const Navigation = () => {
  const { currentUser, logout, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  /**
   * Opens the user menu
   * 
   * @param {React.MouseEvent} event - Click event on the user avatar
   */
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * Closes the user menu
   */
  const handleClose = () => {
    setAnchorEl(null);
  };

  /**
   * Handles user logout and redirects to login page
   */
  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Checks if the given path matches the current route
   * Used to highlight active navigation items
   * 
   * @param {string} path - Route path to check
   * @returns {boolean} Whether the path is active
   */
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" elevation={0} sx={{ 
      backgroundColor: 'primary.main',
      borderBottom: '1px solid',
      borderColor: 'primary.dark'
    }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* App title/logo */}
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            Candidate Session Manager
          </Typography>
          
          {currentUser ? (
            <>
              {/* Navigation links - shown based on user role */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentUser.user_type !== 'candidate' && (
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/sessions"
                    sx={{ 
                      borderRadius: 1,
                      px: 2,
                      fontWeight: isActive('/sessions') ? 700 : 500,
                      borderBottom: isActive('/sessions') ? '3px solid white' : 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    Sessions
                  </Button>
                )}
                
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/forms"
                  sx={{ 
                    borderRadius: 1, 
                    px: 2,
                    fontWeight: isActive('/forms') ? 700 : 500,
                    borderBottom: isActive('/forms') ? '3px solid white' : 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Forms
                </Button>
                
                {isFaculty && (
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/faculty-dashboard"
                    sx={{ 
                      borderRadius: 1, 
                      px: 2,
                      fontWeight: isActive('/faculty-dashboard') ? 700 : 500,
                      borderBottom: isActive('/faculty-dashboard') ? '3px solid white' : 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    Faculty
                  </Button>
                )}
                
                {isAdmin && (
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/admin-dashboard"
                    sx={{ 
                      borderRadius: 1, 
                      px: 2,
                      fontWeight: isActive('/admin-dashboard') ? 700 : 500,
                      borderBottom: isActive('/admin-dashboard') ? '3px solid white' : 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    Admin
                  </Button>
                )}
              </Box>
              
              {/* User avatar and menu */}
              <IconButton
                size="small"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ ml: 2 }}
              >
                {currentUser.first_name ? (
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: 'secondary.main',
                      fontWeight: 600,
                      border: '2px solid white'
                    }}
                  >
                    {currentUser.first_name[0]}
                  </Avatar>
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{ mt: 1 }}
                PaperProps={{
                  elevation: 3,
                  sx: { minWidth: 180, borderRadius: 2 }
                }}
              >
                <MenuItem component={Link} to="/profile" onClick={handleClose}>Profile</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            /* Login button for unauthenticated users */
            <Button 
              color="inherit" 
              component={Link} 
              to="/login"
              variant="outlined"
              sx={{ 
                borderColor: 'white', 
                borderRadius: 2,
                '&:hover': { 
                  bgcolor: 'white', 
                  color: 'primary.main' 
                }
              }}
            >
              Sign In with Google
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;