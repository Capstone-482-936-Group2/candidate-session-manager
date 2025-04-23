/**
 * User registration component that allows new users to create an account.
 * Captures user details, validates inputs, and handles the registration process.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Typography, Container, Box, Paper, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/**
 * Register component for user signup.
 * Manages form state, validation, and submission to create new user accounts.
 * Automatically logs the user in after successful registration.
 * @returns {React.ReactNode} The registration form UI
 */
const Register = () => {
  /**
   * Form state containing all user registration fields
   */
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const { register, login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handles input field changes and updates form state
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  /**
   * Handles form submission, validates inputs, and processes registration
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password confirmation
    if (formData.password !== formData.password2) {
      return setError('Passwords do not match');
    }
    
    try {
      await register(formData);
      // After successful registration, log the user in
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data) {
        // Format Django REST errors - handle both array and string formats
        const errors = Object.entries(err.response.data)
          .map(([field, messages]) => {
            // Check if messages is an array before using join
            const messageStr = Array.isArray(messages) 
              ? messages.join(', ') 
              : messages.toString();
            return `${field}: ${messageStr}`;
          })
          .join('\n');
        setError(errors);
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center">
          Sign Up
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="first_name"
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="last_name"
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password2"
            label="Confirm Password"
            type="password"
            id="password2"
            value={formData.password2}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link to="/login">
              {"Already have an account? Sign In"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;