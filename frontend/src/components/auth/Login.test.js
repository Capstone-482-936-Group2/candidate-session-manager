import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';

// Mock the router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock Google Login component
jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }) => (
    <div data-testid="mock-google-login">
      <button 
        onClick={() => onSuccess({ credential: 'mock-credential' })}
        data-testid="google-login-success"
      >
        Sign in with Google
      </button>
      <button 
        onClick={() => onSuccess({})}
        data-testid="google-login-no-credential"
      >
        Sign in (no credential)
      </button>
    </div>
  )
}));

describe('Login Component', () => {
  const mockNavigate = jest.fn();
  const mockLoginWithGoogle = jest.fn();
  const mockSearchParams = new URLSearchParams();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([mockSearchParams]);
    useAuth.mockReturnValue({
      loginWithGoogle: mockLoginWithGoogle
    });
  });

  it('renders login page with Google sign-in button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Sign in to the Candidate Session Manager')).toBeInTheDocument();
    expect(screen.getByTestId('mock-google-login')).toBeInTheDocument();
  });

  it('handles successful login for regular user', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({ user_type: 'faculty' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('google-login-success'));

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-credential');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles successful login for candidate', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({ user_type: 'candidate' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('google-login-success'));

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-credential');
      expect(mockNavigate).toHaveBeenCalledWith('/forms');
    });
  });

  it('redirects to specific form when formId is present', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({ user_type: 'faculty' });
    mockSearchParams.set('formId', '123');
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('google-login-success'));

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-credential');
      expect(mockNavigate).toHaveBeenCalledWith('/forms/123');
    });
  });

  it('displays error message on login failure', async () => {
    const error = new Error('Login failed');
    error.response = { 
      status: 403,
      data: { error: 'This email is not associated with an approved user. Please contact an administrator to request access.' }
    };
    mockLoginWithGoogle.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('google-login-success'));

    await waitFor(() => {
      expect(screen.getByText('This email is not associated with an approved user. Please contact an administrator to request access.')).toBeInTheDocument();
    });
  });

  it('handles missing Google credential', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('google-login-no-credential'));

    await waitFor(() => {
      expect(screen.getByText('Failed to login with Google')).toBeInTheDocument();
    });
  });
});
