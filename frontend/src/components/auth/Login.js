import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Box, Paper, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google Sign-In successful. Credential:', credentialResponse);
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      await loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to login with Google');
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
        
        {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
