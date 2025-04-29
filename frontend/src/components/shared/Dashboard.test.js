// src/components/shared/Dashboard.test.js

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, first_name: 'Test', email: 'test@example.com' },
    isFaculty: true,
    isAdmin: true
  })
}));

// Mock the API calls
jest.mock('../../api/api', () => ({
  seasonsAPI: {
    getSeasons: jest.fn().mockResolvedValue({ 
      data: [{ id: 1, name: 'Spring 2025' }] 
    })
  },
  candidateSectionsAPI: {
    getCandidateSectionsBySeason: jest.fn().mockResolvedValue({ 
      data: [
        { 
          id: 1, 
          name: 'Test Section', 
          time_slots: [
            { id: 1, start_time: '2025-05-01T09:00:00Z', end_time: '2025-05-01T10:00:00Z' }
          ] 
        }
      ] 
    })
  },
  timeSlotsAPI: {
    registerForTimeSlot: jest.fn().mockResolvedValue({}),
    unregisterFromTimeSlot: jest.fn().mockResolvedValue({})
  }
}));

// Mock MUI components that might cause issues
jest.mock('@mui/material/CircularProgress', () => () => <div data-testid="loading-spinner">Loading...</div>);

// Mock SessionCalendar component
jest.mock('../calendar/SessionCalendar', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  test('renders welcome message with user name', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test/i)).toBeInTheDocument();
    });
  });

  test('renders faculty options when user is faculty', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Faculty Options/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Go to Faculty Dashboard/i })).toBeInTheDocument();
    });
  });

  test('renders admin options when user is admin', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Admin Options/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Go to Admin Dashboard/i })).toBeInTheDocument();
    });
  });


  test('displays empty state message when no candidate sections exist', async () => {
    const { candidateSectionsAPI } = require('../../api/api');
    
    // Mock empty sections response
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({ data: [] });
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/No calendar events found/i)).toBeInTheDocument();
    });
  });

  test('displays error message when API call fails', async () => {
    const { seasonsAPI } = require('../../api/api');
    
    // Mock API error
    seasonsAPI.getSeasons.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load calendar data/i)).toBeInTheDocument();
    });
  });
  test('handles unregistration error correctly', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
    
    // Clear all mocks for this test
    jest.clearAllMocks();
    
    // Override the default mock implementations for this test
    const mockSessionCalendar = require('../calendar/SessionCalendar').default;
    mockSessionCalendar.mockImplementation(props => (
      <div data-testid="session-calendar">
        <p>Mock Calendar Component</p>
        <button onClick={() => props.onUnregister(1)}>Unregister</button>
      </div>
    ));
    
    // Initial data load
    seasonsAPI.getSeasons.mockResolvedValueOnce({ 
      data: [{ id: 1, name: 'Spring 2025' }] 
    });
    
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({ 
      data: [
        { 
          id: 1, 
          name: 'Test Section',
          time_slots: [
            { 
              id: 1, 
              start_time: '2025-05-01T09:00:00Z', 
              end_time: '2025-05-01T10:00:00Z'
            }
          ] 
        }
      ] 
    });
    
    // Mock the unregistration to fail
    timeSlotsAPI.unregisterFromTimeSlot.mockRejectedValueOnce(new Error('Unregistration failed'));
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Make sure calendar is rendered
    expect(screen.getByTestId('session-calendar')).toBeInTheDocument();
    
    // Click unregister button
    fireEvent.click(screen.getByRole('button', { name: /Unregister/i }));
    
    // Verify API call happened
    expect(timeSlotsAPI.unregisterFromTimeSlot).toHaveBeenCalledWith(1);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to unregister from time slot/i)).toBeInTheDocument();
    });
  });
  test('handles candidate sections API error correctly', async () => {
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');
    
    // Mock successful seasons response but failed sections response
    seasonsAPI.getSeasons.mockResolvedValueOnce({ 
      data: [{ id: 1, name: 'Spring 2025', is_active: true }] 
    });
    
    // Mock the sections API to fail
    candidateSectionsAPI.getCandidateSectionsBySeason.mockRejectedValueOnce(
      new Error('Failed to fetch candidate sections')
    );
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  
    // Verify error message is displayed
    expect(screen.getByText(/Failed to load calendar data/i)).toBeInTheDocument();
  
    // Verify calendar header is still present but calendar is not
    expect(screen.getByText(/Session Calendar/i)).toBeInTheDocument();
    expect(screen.queryByTestId('session-calendar')).not.toBeInTheDocument();
  
    // Verify the API was called with the correct season ID
    expect(candidateSectionsAPI.getCandidateSectionsBySeason).toHaveBeenCalledWith(1);
  
    // Verify that basic UI elements are still present
    expect(screen.getByText(/Welcome, Test/i)).toBeInTheDocument();
    expect(screen.getByText(/Your session management dashboard/i)).toBeInTheDocument();
  });
  test('faculty and admin dashboard buttons have correct links', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      // Faculty dashboard button
      const facultyButton = screen.getByRole('link', { name: /Go to Faculty Dashboard/i });
      expect(facultyButton).toBeInTheDocument();
      expect(facultyButton).toHaveAttribute('href', '/faculty-dashboard');
  
      // Admin dashboard button
      const adminButton = screen.getByRole('link', { name: /Go to Admin Dashboard/i });
      expect(adminButton).toBeInTheDocument();
      expect(adminButton).toHaveAttribute('href', '/admin-dashboard');
    });
  });
  test('shows empty calendar message if candidate sections have no time slots', async () => {
    const { candidateSectionsAPI } = require('../../api/api');
  
    // Mock 1 candidate section but with no time slots
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({ 
      data: [
        {
          id: 1,
          name: 'Empty Section',
          time_slots: []
        }
      ]
    });
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByText(/No calendar events found/i)).toBeInTheDocument();
    });
  
    // Should not render the session calendar
    expect(screen.queryByTestId('session-calendar')).not.toBeInTheDocument();
  });
  test('shows empty calendar message if no seasons are available', async () => {
    const { seasonsAPI } = require('../../api/api');
  
    // Mock no seasons returned
    seasonsAPI.getSeasons.mockResolvedValueOnce({ data: [] });
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByText(/No calendar events found/i)).toBeInTheDocument();
    });
  
    // Calendar should not be rendered
    expect(screen.queryByTestId('session-calendar')).not.toBeInTheDocument();
  });
  test('handles registration error correctly', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
  
    // Clear all mocks
    jest.clearAllMocks();
  
    // Mock SessionCalendar to trigger registration
    const mockSessionCalendar = require('../calendar/SessionCalendar').default;
    mockSessionCalendar.mockImplementation(props => (
      <div data-testid="session-calendar">
        <p>Mock Calendar Component</p>
        <button onClick={() => props.onRegister(1)}>Register</button>
      </div>
    ));
  
    // Mock successful initial season/sections load
    seasonsAPI.getSeasons.mockResolvedValueOnce({ 
      data: [{ id: 1, name: 'Spring 2025' }] 
    });
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({ 
      data: [
        {
          id: 1,
          name: 'Test Section',
          time_slots: [{ id: 1, start_time: '2025-05-01T09:00:00Z', end_time: '2025-05-01T10:00:00Z' }]
        }
      ]
    });
  
    // Mock registration API to fail
    timeSlotsAPI.registerForTimeSlot.mockRejectedValueOnce(new Error('Registration failed'));
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    // Wait for calendar to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  
    // Make sure calendar is rendered
    expect(screen.getByTestId('session-calendar')).toBeInTheDocument();
  
    // Click Register button
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
  
    // Verify API call happened
    expect(timeSlotsAPI.registerForTimeSlot).toHaveBeenCalledWith(1);
  
    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/Failed to register for time slot/i)).toBeInTheDocument();
    });
  });
  test('falls back to email if user has no first name', async () => {
    // Override AuthContext for this test
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      currentUser: { id: 1, email: 'test@example.com' }, // no first_name
      isFaculty: false,
      isAdmin: false
    }));
  
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');
    
    // Clear mocks
    jest.clearAllMocks();
  
    // Mock empty seasons and sections
    seasonsAPI.getSeasons.mockResolvedValueOnce({ data: [] });
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({ data: [] });
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByText(/Welcome, test@example\.com/i)).toBeInTheDocument();
    });
  });
  test('shows single error message if both seasons and sections API fail', async () => {
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');
  
    // Clear previous mocks
    jest.clearAllMocks();
  
    // Re-mock AuthContext
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      currentUser: { id: 1, first_name: 'Test', email: 'test@example.com' },
      isFaculty: true,
      isAdmin: true
    }));
  
    // Mock both APIs to fail
    seasonsAPI.getSeasons.mockRejectedValueOnce(new Error('Failed to fetch seasons'));
    candidateSectionsAPI.getCandidateSectionsBySeason.mockRejectedValueOnce(new Error('Failed to fetch sections'));
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    // Wait until loading finishes
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  
    // Check for exactly one error message
    const errorMessages = screen.getAllByText(/Failed to load calendar data/i);
    expect(errorMessages.length).toBe(1);
  
    // Calendar should not be rendered
    expect(screen.queryByTestId('session-calendar')).not.toBeInTheDocument();
  });
  
});