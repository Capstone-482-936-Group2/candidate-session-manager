import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Alert, 
  Button,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Login = () => {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId');
  const theme = useTheme();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google Sign-In successful. Credential:', credentialResponse);
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      const user = await loginWithGoogle(credentialResponse.credential);
      
      // If there's a formId in the URL, redirect to that form
      if (formId) {
        navigate(`/forms/${formId}`);
      } else {
        // Candidates go to forms, everyone else to dashboard
        if (user.user_type === 'candidate') {
          navigate('/forms');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to login with Google';
      setError(errorMessage);
      
      // If the error is about unauthorized access, show a more specific message
      if (err.response?.status === 403) {
        setError('This email is not associated with an approved user. Please contact an administrator to request access.');
      }
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google Sign-In Error:', error);
    setError('Google sign-in was unsuccessful');
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <Card 
        elevation={3} 
        sx={{ 
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Box sx={{ 
          bgcolor: 'primary.main', 
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white'
        }}>
          <Box sx={{ 
            bgcolor: 'background.paper', 
            p: 1.5, 
            borderRadius: '50%',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LockOutlinedIcon fontSize="large" color="primary" />
          </Box>
          <Typography component="h1" variant="h4" fontWeight={600}>
            Welcome
          </Typography>
          <Typography variant="body1" color="white" align="center" sx={{ mt: 1, opacity: 0.9 }}>
            Sign in to the Candidate Session Manager
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert 
              severity={error.includes('not associated with an approved user') ? 'warning' : 'error'} 
              sx={{ 
                mb: 3,
                borderRadius: 1.5,
                fontSize: '0.95rem'
              }}
              action={
                error.includes('not associated with an approved user') && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => navigate('/register')}
                    sx={{ fontWeight: 600 }}
                  >
                    Register
                  </Button>
                )
              }
            >
              {error}
            </Alert>
          )}
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
              Sign in with
            </Typography>
          </Divider>
          
          <Box sx={{ 
            mt: 3,
            display: 'flex', 
            justifyContent: 'center',
            transform: 'scale(1.1)',
            mb: 1
          }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Need help? Contact the system administrator.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;