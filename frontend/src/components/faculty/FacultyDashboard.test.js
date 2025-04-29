import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FacultyDashboard from './FacultyDashboard';
import { useAuth } from '../../context/AuthContext';
import { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } from '../../api/api';

// Mock the APIs and Auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/api', () => ({
  seasonsAPI: {
    getSeasons: jest.fn(),
  },
  candidateSectionsAPI: {
    getCandidateSectionsBySeason: jest.fn(),
  },
  timeSlotsAPI: {
    registerForTimeSlot: jest.fn(),
    unregisterFromTimeSlot: jest.fn(),
  },
}));

describe('FacultyDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { id: 1 } });
  });

  test('renders loading spinner initially', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({ data: [] });
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(seasonsAPI.getSeasons).toHaveBeenCalled());
  });

  test('renders seasons after loading', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });

    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText(/spring 2025/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view candidate sections/i })).toBeInTheDocument();
  });

  test('shows error message when loading seasons fails', async () => {
    seasonsAPI.getSeasons.mockRejectedValueOnce(new Error('Failed to load'));

    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );

    const error = await screen.findByText(/failed to load recruiting seasons/i);
    expect(error).toBeInTheDocument();
  });

  test('loads candidate sections after selecting a season', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        time_slots: [{
          id: 1,
          start_time: '2025-01-15T10:00:00Z',
          end_time: '2025-01-15T11:00:00Z',
          is_visible: true,
          attendees: [],
          max_attendees: 5
        }]
      }]
    });
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // Wait for "Available Time Slots" heading
    const availableSlotsHeading = await screen.findByText(/available time slots/i);
    expect(availableSlotsHeading).toBeInTheDocument();
  
    // ✅ Check for John Doe's full heading
    const candidateHeading = await screen.findByRole('heading', { name: /john doe/i });
    expect(candidateHeading).toBeInTheDocument();
  });
  
  test('allows faculty to register for a time slot', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        time_slots: [{
          id: 123,  // Important to give an ID to the slot
          start_time: '2025-01-15T10:00:00Z',
          end_time: '2025-01-15T11:00:00Z',
          is_visible: true,
          attendees: [],
          max_attendees: 5
        }]
      }]
    });
  
    timeSlotsAPI.registerForTimeSlot.mockResolvedValue({}); // Mock successful register
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    // Load seasons and click to view candidates
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // Wait for Available Time Slots heading
    await screen.findByText(/available time slots/i);
  
    // Find and click the Register button
    const registerButton = await screen.findByRole('button', { name: /register/i });
    fireEvent.click(registerButton);
  
    // Ensure API was called correctly
    expect(timeSlotsAPI.registerForTimeSlot).toHaveBeenCalledWith(123);
  
    // Wait for success message
    const successMessage = await screen.findByText(/successfully registered for the time slot/i);
    expect(successMessage).toBeInTheDocument();
  });
  
  test('allows faculty to unregister from a time slot', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        time_slots: [{
          id: 456,
          start_time: '2025-01-15T10:00:00Z',
          end_time: '2025-01-15T11:00:00Z',
          is_visible: true,
          attendees: [
            { id: 10, user: { id: 1, first_name: 'Faculty', last_name: 'Member', email: 'faculty@example.com' } }
          ],
          max_attendees: 5
        }]
      }]
    });
  
    timeSlotsAPI.unregisterFromTimeSlot.mockResolvedValue({}); // Mock successful unregister
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    // Load seasons and click to view candidates
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // Wait for Available Time Slots heading
    await screen.findByText(/available time slots/i);
  
    // 🔥 Find and click the Unregister button
    const unregisterButton = await screen.findByRole('button', { name: /unregister/i });
    fireEvent.click(unregisterButton);
  
    // 🔥 Ensure API was called correctly
    expect(timeSlotsAPI.unregisterFromTimeSlot).toHaveBeenCalledWith(456);
  
    // 🔥 Wait for success message
    const successMessage = await screen.findByText(/successfully unregistered from the time slot/i);
    expect(successMessage).toBeInTheDocument();
  });
test('displays registered attendees when clicking attendees menu', async () => {
  seasonsAPI.getSeasons.mockResolvedValue({
    data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
  });

  candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
    data: [{
      id: 1,
      candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      time_slots: [{
        id: 789,
        start_time: '2025-01-20T14:00:00Z',
        end_time: '2025-01-20T15:00:00Z',
        is_visible: true,
        attendees: [
          { id: 1, user: { id: 2, first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' } },
          { id: 2, user: { id: 3, first_name: 'Bob', last_name: 'Jones', email: 'bob@example.com' } }
        ],
        max_attendees: 5
      }]
    }]
  });

  render(
    <MemoryRouter>
      <FacultyDashboard />
    </MemoryRouter>
  );

  // Load seasons and click to view candidates
  const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
  fireEvent.click(viewButton);

  // Wait for Available Time Slots heading
  await screen.findByText(/available time slots/i);

  // 🔥 Find and click the attendees button (the icon button)
  const attendeeButtons = await screen.findAllByRole('button');
  const attendeeMenuButton = attendeeButtons.find(button => 
    button.innerHTML.includes('data-testid="GroupIcon"')
  );
  
  expect(attendeeMenuButton).toBeDefined();
  fireEvent.click(attendeeMenuButton);

  // 🔥 After clicking, it should show attendee names
  expect(await screen.findByText(/alice smith/i)).toBeInTheDocument();
  expect(await screen.findByText(/bob jones/i)).toBeInTheDocument();
});
test('displays registered attendees when clicking attendees menu', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        time_slots: [{
          id: 789,
          start_time: '2025-01-20T14:00:00Z',
          end_time: '2025-01-20T15:00:00Z',
          is_visible: true,
          attendees: [
            { id: 1, user: { id: 2, first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' } },
            { id: 2, user: { id: 3, first_name: 'Bob', last_name: 'Jones', email: 'bob@example.com' } }
          ],
          max_attendees: 5
        }]
      }]
    });
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    // Load seasons and click to view candidates
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // Wait for Available Time Slots heading
    await screen.findByText(/available time slots/i);
  
    // 🔥 Find and click the attendees button (the icon button)
    const attendeeButtons = await screen.findAllByRole('button');
    const attendeeMenuButton = attendeeButtons.find(button => 
      button.innerHTML.includes('data-testid="GroupIcon"')
    );
    
    expect(attendeeMenuButton).toBeDefined();
    fireEvent.click(attendeeMenuButton);
  
    // 🔥 After clicking, it should show attendee names
    expect(await screen.findByText(/alice smith/i)).toBeInTheDocument();
    expect(await screen.findByText(/bob jones/i)).toBeInTheDocument();
  });
  test('allows navigating back to season selection', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        time_slots: [{
          id: 789,
          start_time: '2025-01-20T14:00:00Z',
          end_time: '2025-01-20T15:00:00Z',
          is_visible: true,
          attendees: [],
          max_attendees: 5
        }]
      }]
    });
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    // Load seasons and click to view candidates
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // Wait for Available Time Slots heading
    await screen.findByText(/available time slots/i);
  
    // 🔥 Find and click the Back to Seasons button
    const backButton = await screen.findByRole('button', { name: /back to seasons/i });
    fireEvent.click(backButton);
  
    // 🔥 After clicking back, it should return to season selection view
    expect(await screen.findByText(/select a recruiting season/i)).toBeInTheDocument();
  });
  test('displays no candidates message when there are no candidate sections', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: []  // 🔥 No candidates returned
    });
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // 🔥 After loading, find the heading exactly
    const noCandidatesHeading = await screen.findByRole('heading', { name: /no candidate sections available/i });
    expect(noCandidatesHeading).toBeInTheDocument();
  });
  
  test('shows error message if registering for a time slot fails', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        time_slots: [{
          id: 999,
          start_time: '2025-01-20T10:00:00Z',
          end_time: '2025-01-20T11:00:00Z',
          is_visible: true,
          attendees: [],
          max_attendees: 5
        }]
      }]
    });
  
    timeSlotsAPI.registerForTimeSlot.mockRejectedValue(new Error('Server error')); // 🔥 simulate API failing
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    // Load seasons and click to view candidates
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // Wait for candidates to load
    await screen.findByText(/available time slots/i);
  
    // 🔥 Find and click Register button
    const registerButton = await screen.findByRole('button', { name: /register/i });
    fireEvent.click(registerButton);
  
    // 🔥 After clicking, should show error message
    const errorMessage = await screen.findByText(/failed to register for time slot/i);
    expect(errorMessage).toBeInTheDocument();
  });
  
  test('shows error message if unregistering from a time slot fails', async () => {
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 1, title: 'Spring 2025', start_date: '2025-01-01', end_date: '2025-05-01' }]
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        time_slots: [{
          id: 777,
          start_time: '2025-01-20T10:00:00Z',
          end_time: '2025-01-20T11:00:00Z',
          is_visible: true,
          attendees: [
            { id: 1, user: { id: 1, first_name: 'Faculty', last_name: 'User', email: 'faculty@example.com' } }
          ],
          max_attendees: 5
        }]
      }]
    });
  
    timeSlotsAPI.unregisterFromTimeSlot.mockRejectedValue(new Error('Server error')); // 🔥 simulate API failing
  
    render(
      <MemoryRouter>
        <FacultyDashboard />
      </MemoryRouter>
    );
  
    // Load seasons and click to view candidates
    const viewButton = await screen.findByRole('button', { name: /view candidate sections/i });
    fireEvent.click(viewButton);
  
    // Wait for candidates to load
    await screen.findByText(/available time slots/i);
  
    // 🔥 Find and click Unregister button
    const unregisterButton = await screen.findByRole('button', { name: /unregister/i });
    fireEvent.click(unregisterButton);
  
    // 🔥 After clicking, should show error message
    const errorMessage = await screen.findByText(/failed to unregister from time slot/i);
    expect(errorMessage).toBeInTheDocument();
  });
  
});