import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Register from './Register';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock navigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

const mockNavigate = jest.fn();

describe('Register Component', () => {
  const mockRegister = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      register: mockRegister,
      login: mockLogin
    });
  });

  const fillForm = (formData = {}) => {
    const defaultData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      password2: 'password123',
      first_name: 'Test',
      last_name: 'User'
    };

    const data = { ...defaultData, ...formData };

    // Find inputs by their name attribute
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: data.email }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /username/i }), {
      target: { value: data.username }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: data.password }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: data.password2 }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: data.first_name }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: data.last_name }
    });
  };

  it('renders registration form', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    // Check for form elements
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /last name/i })).toBeInTheDocument();
    
    // Find password fields by their ID instead
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('password2')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('handles successful registration and login', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fillForm();

    mockRegister.mockResolvedValueOnce({});
    mockLogin.mockResolvedValueOnce({});

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        password2: 'password123',
        first_name: 'Test',
        last_name: 'User'
      });
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error when passwords do not match', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fillForm({ password2: 'differentpassword' });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it('displays backend validation errors', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fillForm();

    const backendError = {
      response: {
        data: {
          email: ['Email already exists'],
          username: ['Username already taken']
        }
      }
    };

    mockRegister.mockRejectedValueOnce(backendError);

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email: Email already exists/)).toBeInTheDocument();
      expect(screen.getByText(/username: Username already taken/)).toBeInTheDocument();
    });
  });

  it('displays generic error message for non-validation errors', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fillForm();

    mockRegister.mockRejectedValueOnce(new Error('Network error'));

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });

  it('handles form field updates', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    expect(emailInput.value).toBe('new@example.com');

    const usernameInput = screen.getByRole('textbox', { name: /username/i });
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    expect(usernameInput.value).toBe('newuser');
  });

  it('provides link to login page', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const loginLink = screen.getByText(/already have an account\? sign in/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('requires all fields to be filled', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      // Check that inputs have the required attribute
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('required');
      });

      // Check password fields
      const password = screen.getByTestId('password');
      const password2 = screen.getByTestId('password2');
      expect(password).toHaveAttribute('required');
      expect(password2).toHaveAttribute('required');

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });
});
