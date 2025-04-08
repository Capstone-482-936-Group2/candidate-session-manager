import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Container, Box, Paper, Alert, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google Sign-In successful. Credential:', credentialResponse);
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      await loginWithGoogle(credentialResponse.credential);
      
      // If there's a formId in the URL, redirect to that form
      if (formId) {
        navigate(`/forms/${formId}`);
      } else {
        navigate('/dashboard');
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
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Sign In with Google
        </Typography>
        
        {error && (
          <Alert 
            severity={error.includes('not associated with an approved user') ? 'warning' : 'error'} 
            sx={{ mt: 2, mb: 2 }}
            action={
              error.includes('not associated with an approved user') && (
                <Button color="inherit" size="small" onClick={() => navigate('/register')}>
                  Register
                </Button>
              )
            }
          >
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
