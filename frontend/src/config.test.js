describe('Config', () => {
  // Store the original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear the module cache before each test
    jest.resetModules();
    // Create a fresh copy of process.env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  it('should use default localhost URL when REACT_APP_API_URL is not set', () => {
    // Delete any existing REACT_APP_API_URL
    delete process.env.REACT_APP_API_URL;
    
    // Import the config after environment modification
    const { API_BASE_URL } = require('./config');
    
    // Check if it uses the default URL
    expect(API_BASE_URL).toBe('http://localhost:8000');
  });

  it('should use environment variable when REACT_APP_API_URL is set', () => {
    // Set a test API URL
    process.env.REACT_APP_API_URL = 'https://api.example.com';
    
    // Import the config after environment modification
    const { API_BASE_URL } = require('./config');
    
    // Check if it uses the environment variable
    expect(API_BASE_URL).toBe('https://api.example.com');
  });

  it('should handle empty string in REACT_APP_API_URL', () => {
    // Set an empty API URL
    process.env.REACT_APP_API_URL = '';
    
    // Import the config after environment modification
    const { API_BASE_URL } = require('./config');
    
    // Should fall back to default URL
    expect(API_BASE_URL).toBe('http://localhost:8000');
  });
});
