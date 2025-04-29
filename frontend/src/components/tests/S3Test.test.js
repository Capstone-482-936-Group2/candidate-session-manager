// S3Test.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import S3Test from './S3Test';
import { testAPI } from '../../api/api';

// Mock the testAPI module
jest.mock('../../api/api', () => ({
  testAPI: {
    testS3: jest.fn(),
  },
}));

describe('S3Test Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button initially', () => {
    render(<S3Test />);
    expect(screen.getByRole('button', { name: /test s3 configuration/i })).toBeInTheDocument();
  });

  it('disables the button and shows loading spinner when loading', async () => {
    const promise = new Promise(() => {}); // pending promise to simulate loading
    testAPI.testS3.mockReturnValue(promise);

    render(<S3Test />);
    const button = screen.getByRole('button', { name: /test s3 configuration/i });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows success alert on API success', async () => {
    const mockData = { success: true };
    testAPI.testS3.mockResolvedValueOnce({ data: mockData });
  
    render(<S3Test />);
    const button = screen.getByRole('button', { name: /test s3 configuration/i });
    fireEvent.click(button);
  
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/success/i);
    expect(alert).toHaveTextContent('"success": true');
  });
  
  it('shows error alert on API failure', async () => {
    const mockError = { message: 'S3 error' };
    testAPI.testS3.mockRejectedValueOnce({ response: { data: mockError } });
  
    render(<S3Test />);
    const button = screen.getByRole('button', { name: /test s3 configuration/i });
    fireEvent.click(button);
  
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/error/i);
    expect(alert).toHaveTextContent('"message": "S3 error"');
  });
  
  it('shows generic error message if no response data', async () => {
    testAPI.testS3.mockRejectedValueOnce({});
  
    render(<S3Test />);
    const button = screen.getByRole('button', { name: /test s3 configuration/i });
    fireEvent.click(button);
  
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/test failed/i);
  });
  
});