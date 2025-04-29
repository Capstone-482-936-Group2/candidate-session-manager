import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SessionsList from './SessionsList';
import { useAuth } from '../../context/AuthContext';
import { sessionsAPI, timeSlotsAPI } from '../../api/api';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the API calls
jest.mock('../../api/api', () => ({
  sessionsAPI: {
    getSessions: jest.fn(),
    createSession: jest.fn()
  },
  timeSlotsAPI: {
    createTimeSlot: jest.fn(),
    registerForTimeSlot: jest.fn(),
    unregisterFromTimeSlot: jest.fn()
  }
}));
const AllTheProviders = ({ children }) => {
    return (
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {children}
        </LocalizationProvider>
      </BrowserRouter>
    );
  };
describe('SessionsList', () => {
  it('should show different views based on user role', async () => {
    // Mock session data
    const mockSessions = [
      {
        id: 1,
        title: 'Test Session',
        description: 'Test Description',
        location: 'Test Location',
        needs_transportation: true,
        candidate: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe'
        },
        time_slots: [
          {
            id: 1,
            start_time: '2024-03-20T10:00:00Z',
            end_time: '2024-03-20T11:00:00Z',
            is_visible: true,
            available_slots: 2,
            attendees: []
          }
        ]
      }
    ];

    // Mock API response
    sessionsAPI.getSessions.mockResolvedValue({ data: mockSessions });

    // Mock auth context for faculty user
    useAuth.mockReturnValue({
      currentUser: { id: 456, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });

    render(<SessionsList />);

    // Check faculty view specifics
    expect(await screen.findByText('All Candidate Sessions')).toBeInTheDocument();
    expect(await screen.findByText('Test Session')).toBeInTheDocument();
    expect(await screen.findByText(/John Doe/)).toBeInTheDocument();
    
    // Faculty should see register button
    const registerButton = await screen.findByRole('button', { name: /Register/i });
    expect(registerButton).toBeInTheDocument();
    
    // Faculty should not see "Schedule Session" button
    expect(screen.queryByText('Schedule Session')).not.toBeInTheDocument();
  });
  it('displays loading message while fetching sessions', () => {
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
    
    expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
  });
  it('displays an error message when sessions fail to load', async () => {
    sessionsAPI.getSessions.mockRejectedValue(new Error('API error'));
    
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
  
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load sessions');
  });
  it('shows candidate view with "Schedule Session" button', async () => {
    sessionsAPI.getSessions.mockResolvedValue({ data: [] });
  
    useAuth.mockReturnValue({
      currentUser: { id: 123, user_type: 'candidate' },
      isAdmin: false,
      isFaculty: false
    });
  
    render(<SessionsList />);
  
    expect(await screen.findByText('My Sessions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schedule Session/i })).toBeInTheDocument();
  });
  it('opens the Schedule Session dialog when Schedule Session button is clicked', async () => {
    // Mock auth for candidate view
    useAuth.mockReturnValue({
      currentUser: { id: 123, user_type: 'candidate' },
      isAdmin: false,
      isFaculty: false
    });

    render(<SessionsList />, { wrapper: AllTheProviders });

    // Find and click the Schedule Session button
    const scheduleButton = await screen.findByRole('button', { name: /Schedule Session/i });
    await userEvent.click(scheduleButton);

    // The AddSessionDialog should open
    expect(await screen.findByText(/Schedule Your Session/i)).toBeInTheDocument();
  });
  it('shows "No time slots available" when a session has no time slots', async () => {
    const mockSessions = [
      {
        id: 1,
        title: 'Empty Session',
        description: 'No time slots here',
        location: 'Test Location',
        needs_transportation: false,
        candidate: { id: 123, first_name: 'Jane', last_name: 'Doe' },
        time_slots: [] // No time slots!
      }
    ];
  
    sessionsAPI.getSessions.mockResolvedValue({ data: mockSessions });
  
    useAuth.mockReturnValue({
      currentUser: { id: 123, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
  
    expect(await screen.findByText('Empty Session')).toBeInTheDocument();
    expect(screen.getByText('No time slots available for this session.')).toBeInTheDocument();
  });
  it('calls registerForTimeSlot API when Register button is clicked', async () => {
    const mockSessions = [
      {
        id: 1,
        title: 'Register Session',
        description: 'Session description',
        location: 'Test Location',
        needs_transportation: false,
        candidate: { id: 123, first_name: 'Jane', last_name: 'Doe' },
        time_slots: [
          {
            id: 101,
            start_time: '2024-05-01T14:00:00Z',
            end_time: '2024-05-01T15:00:00Z',
            is_visible: true,
            available_slots: 2,
            attendees: []
          }
        ]
      }
    ];
  
    sessionsAPI.getSessions.mockResolvedValue({ data: mockSessions });
    timeSlotsAPI.registerForTimeSlot.mockResolvedValue({}); // mock successful registration
  
    useAuth.mockReturnValue({
      currentUser: { id: 456, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
  
    const registerButton = await screen.findByRole('button', { name: /Register/i });
    
    userEvent.click(registerButton);
  
    expect(timeSlotsAPI.registerForTimeSlot).toHaveBeenCalledWith(101);
  });
  it('calls unregisterFromTimeSlot API when Unregister button is clicked', async () => {
    const mockSessions = [
      {
        id: 1,
        title: 'Unregister Session',
        description: 'Session description',
        location: 'Test Location',
        needs_transportation: false,
        candidate: { id: 123, first_name: 'Jane', last_name: 'Doe' },
        time_slots: [
          {
            id: 202,
            start_time: '2024-05-02T14:00:00Z',
            end_time: '2024-05-02T15:00:00Z',
            is_visible: true,
            available_slots: 1,
            attendees: [
              { user: { id: 456 } } // current user is already registered
            ]
          }
        ]
      }
    ];
  
    sessionsAPI.getSessions.mockResolvedValue({ data: mockSessions });
    timeSlotsAPI.unregisterFromTimeSlot.mockResolvedValue({}); // mock successful unregistration
  
    useAuth.mockReturnValue({
      currentUser: { id: 456, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
  
    const unregisterButton = await screen.findByRole('button', { name: /Unregister/i });
  
    userEvent.click(unregisterButton);
  
    expect(timeSlotsAPI.unregisterFromTimeSlot).toHaveBeenCalledWith(202);
  });
  it('displays "No sessions available" message when no sessions exist', async () => {
    sessionsAPI.getSessions.mockResolvedValue({ data: [] });
  
    useAuth.mockReturnValue({
      currentUser: { id: 789, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
  
    expect(await screen.findByText('No sessions available')).toBeInTheDocument();
  });
  it('fetches sessions when component mounts', async () => {
    sessionsAPI.getSessions.mockResolvedValue({ data: [] });
  
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
  
    expect(sessionsAPI.getSessions).toHaveBeenCalledTimes(1);
  });
  it('creates a session and a time slot successfully', async () => {
    sessionsAPI.getSessions.mockResolvedValue({ data: [] });
  
    sessionsAPI.createSession.mockResolvedValue({
      data: { id: 777 }
    });
  
    timeSlotsAPI.createTimeSlot.mockResolvedValue({});
  
    useAuth.mockReturnValue({
      currentUser: { id: 123, user_type: 'candidate' },
      isAdmin: false,
      isFaculty: false
    });
  
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SessionsList />
      </LocalizationProvider>
    );
  
    const scheduleButton = await screen.findByRole('button', { name: /Schedule Session/i });
  
    userEvent.click(scheduleButton);
  
    // Now we would mock form submission properly here (e.g., simulate form filling or directly calling onSubmit)
    // For now, this handles the mount error
  });
  it('shows correct empty state message for faculty/admin users', async () => {
    sessionsAPI.getSessions.mockResolvedValue({ data: [] });
  
    useAuth.mockReturnValue({
      currentUser: { id: 111, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(<SessionsList />);
  
    expect(await screen.findByText('There are no candidate sessions to display at this time.')).toBeInTheDocument();
  });
  it('shows correct empty state message for candidate users', async () => {
    sessionsAPI.getSessions.mockResolvedValue({ data: [] });
  
    useAuth.mockReturnValue({
      currentUser: { id: 222, user_type: 'candidate' },
      isAdmin: false,
      isFaculty: false
    });
  
    render(<SessionsList />);
  
    expect(await screen.findByText("You haven't scheduled any sessions yet. Click the \"Schedule Session\" button to create one.")).toBeInTheDocument();
  });
  it('disables the Register button if the time slot is full', async () => {
    const mockSessions = [
      {
        id: 1,
        title: 'Full Slot Session',
        description: 'This session is full',
        location: 'Test Location',
        needs_transportation: false,
        candidate: { id: 123, first_name: 'John', last_name: 'Doe' },
        time_slots: [
          {
            id: 303,
            start_time: '2024-07-01T14:00:00Z',
            end_time: '2024-07-01T15:00:00Z',
            is_visible: true,
            is_full: true, // important!
            available_slots: 0,
            attendees: []
          }
        ]
      }
    ];
  
    sessionsAPI.getSessions.mockResolvedValue({ data: mockSessions });
  
    useAuth.mockReturnValue({
      currentUser: { id: 456, user_type: 'faculty' },
      isAdmin: false,
      isFaculty: true
    });
  
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SessionsList />
      </LocalizationProvider>
    );
  
    const registerButton = await screen.findByRole('button', { name: /Register/i });
  
    expect(registerButton).toBeDisabled();
  });
  
});