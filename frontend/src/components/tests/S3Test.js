import React, { useState } from 'react';
import { Button, Alert, Box, CircularProgress } from '@mui/material';
import { testAPI } from '../../api/api';

const S3Test = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await testAPI.testS3();
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data || 'Test failed');
      console.error('S3 test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button 
        variant="contained" 
        onClick={handleTest}
        disabled={loading}
      >
        Test S3 Configuration
      </Button>

      {loading && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {result && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </Alert>
      )}
    </Box>
  );
};

export default S3Test;
