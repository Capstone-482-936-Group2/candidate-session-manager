import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserManagement from './UserManagement';
import { usersAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

// Mock the API
jest.mock('../../api/api', () => ({
  usersAPI: {
    getUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the CandidateProfileDialog component
jest.mock('./CandidateProfileDialog', () => ({
  __esModule: true,
  default: ({ open, onClose, candidateId }) => (
    <div data-testid="mock-candidate-profile-dialog">
      Mock Profile Dialog for candidate {candidateId}
    </div>
  )
}));

describe('UserManagement', () => {
  const mockUsers = [
    {
      id: 1,
      email: 'admin@test.com',
      first_name: 'Admin',
      last_name: 'User',
      user_type: 'admin',
      room_number: 'PETR 123',
      available_for_meetings: true
    },
    {
      id: 2,
      email: 'faculty@test.com',
      first_name: 'Faculty',
      last_name: 'User',
      user_type: 'faculty',
      room_number: 'PETR 456',
      available_for_meetings: true
    },
    {
      id: 3,
      email: 'candidate@test.com',
      first_name: 'Candidate',
      last_name: 'User',
      user_type: 'candidate',
      has_completed_setup: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    usersAPI.getUsers.mockResolvedValue({ data: mockUsers });
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'admin' },
      isSuperAdmin: true
    });
  });

  it('renders loading state initially', () => {
    render(<UserManagement />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders user tables after loading', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for table headers
    expect(screen.getByText('Staff Members')).toBeInTheDocument();
    expect(screen.getByText('Candidates')).toBeInTheDocument();

    // Check for user data
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('faculty@test.com')).toBeInTheDocument();
    expect(screen.getByText('candidate@test.com')).toBeInTheDocument();
  });

  it('handles API error', async () => {
    usersAPI.getUsers.mockRejectedValueOnce(new Error('Failed to load'));
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  it('opens add user dialog', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add New User'));
    expect(screen.getByRole('dialog')).toHaveTextContent('Add New User');
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /last name/i })).toBeInTheDocument();
  });

  it('handles user creation', async () => {
    const newUser = {
      email: 'new@test.com',
      first_name: 'New',
      last_name: 'User',
      user_type: 'faculty',
      room_number: 'PETR 789',
      available_for_meetings: true
    };

    usersAPI.createUser.mockResolvedValueOnce({ data: { id: 4, ...newUser } });
    
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open dialog and fill form
    fireEvent.click(screen.getByText('Add New User'));
    
    // Fill in the form fields
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: newUser.email }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: newUser.first_name }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: newUser.last_name }
    });

    // Select user type using the select component
    const userTypeSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(userTypeSelect);
    const facultyOption = await screen.findByText('Faculty');
    fireEvent.click(facultyOption);

    // Fill in room number
    const roomNumberInput = screen.getByRole('textbox', { name: /room number/i });
    fireEvent.change(roomNumberInput, {
      target: { value: newUser.room_number }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Wait for the API call to be made
    await waitFor(() => {
      expect(usersAPI.createUser).toHaveBeenCalledWith({
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        user_type: newUser.user_type,
        room_number: newUser.room_number,
        available_for_meetings: newUser.available_for_meetings
      });
    });
    
    // Look for success message in alert
    await waitFor(() => {
      const successAlert = screen.getByRole('alert');
      expect(successAlert).toHaveTextContent('User created successfully');
    });
  });

  it('handles user deletion', async () => {
    usersAPI.deleteUser.mockResolvedValueOnce({});
    
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click delete button in the first user row
    const userRow = screen.getByText('admin@test.com').closest('tr');
    const deleteButton = within(userRow).getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion in the dialog
    const deleteConfirmButton = await screen.findByRole('button', { name: /delete/i });
    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(usersAPI.deleteUser).toHaveBeenCalledWith(mockUsers[0].id);
    });
    
    // Look for success message in alert
    await waitFor(() => {
      const successAlert = screen.getByRole('alert');
      expect(successAlert).toHaveTextContent('User deleted successfully');
    });
  });

  it('opens candidate profile dialog', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click the profile button in candidate row
    const candidateRow = screen.getByText('candidate@test.com').closest('tr');
    const profileButton = within(candidateRow).getByRole('button', { name: /profile not complete/i });
    fireEvent.click(profileButton);

    expect(await screen.findByTestId('mock-candidate-profile-dialog')).toBeInTheDocument();
  });

  it('handles user type filtering correctly', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that users are in correct tables
    const staffTable = screen.getByText('Staff Members').closest('div');
    const candidateTable = screen.getByText('Candidates').closest('div');

    expect(staffTable).toHaveTextContent('admin@test.com');
    expect(staffTable).toHaveTextContent('faculty@test.com');
    expect(candidateTable).toHaveTextContent('candidate@test.com');
  });
});
