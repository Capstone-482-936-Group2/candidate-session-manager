import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RecruitingSeasons from './RecruitingSeasons';
import { useAuth } from '../../context/AuthContext';
import userEvent from '@testing-library/user-event'; // make sure you import this!

// Mock context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock APIs
jest.mock('../../api/api', () => ({
  seasonsAPI: {
    getSeasons: jest.fn().mockResolvedValue({ data: [] }),
  },
  candidateSectionsAPI: {
    getCandidateSectionsBySeason: jest.fn().mockResolvedValue({ data: [] }),
  },
  timeSlotsAPI: {
    registerForTimeSlot: jest.fn(),
    unregisterFromTimeSlot: jest.fn(),
  },
}));

describe('RecruitingSeasons', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ currentUser: { id: 1 } });
  });

  it('renders the page header', async () => {
  render(<RecruitingSeasons />);
  const header = await screen.findByRole('heading', { name: /recruiting seasons/i, level: 1 });
  expect(header).toBeInTheDocument();
});

it('shows empty state when no seasons are available', async () => {
    render(<RecruitingSeasons />);
    
    // Look for the empty state heading
    const emptyHeading = await screen.findByRole('heading', { name: /no recruiting seasons available/i });
    expect(emptyHeading).toBeInTheDocument();
    
    // Look for the empty state description
    const emptyDescription = screen.getByText(/please check back later/i);
    expect(emptyDescription).toBeInTheDocument();
  });
  it('shows loading spinner while fetching data', async () => {
    render(<RecruitingSeasons />);
    
    // Spinner should be present initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  it('shows error alert if API call fails', async () => {
    // Override the mock to make it fail
    const { seasonsAPI } = require('../../api/api');
    seasonsAPI.getSeasons.mockRejectedValueOnce(new Error('API Failure'));
  
    render(<RecruitingSeasons />);
  
    // Wait for the error alert to appear
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/failed to load recruiting seasons data/i);
  });
  it('disables register button when time slot is full', async () => {
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');
    
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Fall Recruiting', description: 'Fall season', start_date: '2025-09-01', end_date: '2025-12-01' },
      ],
    });
  
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate A',
          candidate: { first_name: 'Alice', last_name: 'Anderson' },
          location: 'Online',
          description: 'Description here',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 100,
              start_time: '2025-10-01T10:00:00Z',
              end_time: '2025-10-01T11:00:00Z',
              max_attendees: 1,
              attendees: [{ user: { id: 999 } }],
            },
          ],
        },
      ],
    });
  
    render(<RecruitingSeasons />);
  
    // Click to expand the Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Now the "Fully Booked" button will exist
    const fullyBookedButton = await screen.findByRole('button', { name: /fully booked/i });
    
    expect(fullyBookedButton).toBeDisabled();
  });
  it('shows success message after successful registration', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Fall Recruiting', description: 'Fall season', start_date: '2025-09-01', end_date: '2025-12-01' },
      ],
    });
  
    // Initial sections with empty time slot
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate A',
          candidate: { first_name: 'Alice', last_name: 'Anderson' },
          location: 'Online',
          description: 'Description here',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 100,
              start_time: '2025-10-01T10:00:00Z',
              end_time: '2025-10-01T11:00:00Z',
              max_attendees: 2,
              attendees: [],
            },
          ],
        },
      ],
    });
  
    // Make register succeed
    timeSlotsAPI.registerForTimeSlot.mockResolvedValueOnce();
  
    // After registering, component refetches updated sections
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate A',
          candidate: { first_name: 'Alice', last_name: 'Anderson' },
          location: 'Online',
          description: 'Description here',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 100,
              start_time: '2025-10-01T10:00:00Z',
              end_time: '2025-10-01T11:00:00Z',
              max_attendees: 2,
              attendees: [{ user: { id: 1 } }], // Now registered
            },
          ],
        },
      ],
    });
  
    render(<RecruitingSeasons />);
  
    // Expand Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Click Register
    const registerButton = await screen.findByRole('button', { name: /register/i });
    userEvent.click(registerButton);
  
    // Check for success message
    const successAlert = await screen.findByRole('alert');
    expect(successAlert).toHaveTextContent(/successfully registered for the time slot/i);
  });
  it('shows success message after successful unregistration', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Fall Recruiting', description: 'Fall season', start_date: '2025-09-01', end_date: '2025-12-01' },
      ],
    });
  
    // Initial sections with a registered user
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate A',
          candidate: { first_name: 'Alice', last_name: 'Anderson' },
          location: 'Online',
          description: 'Description here',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 100,
              start_time: '2025-10-01T10:00:00Z',
              end_time: '2025-10-01T11:00:00Z',
              max_attendees: 2,
              attendees: [{ user: { id: 1 } }], // User already registered
            },
          ],
        },
      ],
    });
  
    // Mock successful unregistration
    timeSlotsAPI.unregisterFromTimeSlot.mockResolvedValueOnce();
  
    // After unregistration, updated sections show the user is removed
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate A',
          candidate: { first_name: 'Alice', last_name: 'Anderson' },
          location: 'Online',
          description: 'Description here',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 100,
              start_time: '2025-10-01T10:00:00Z',
              end_time: '2025-10-01T11:00:00Z',
              max_attendees: 2,
              attendees: [], // User is removed
            },
          ],
        },
      ],
    });
  
    render(<RecruitingSeasons />);
  
    // Expand the Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Wait until "Cancel Registration" button appears
    const cancelButton = await screen.findByRole('button', { name: /cancel registration/i });
    await waitFor(() => expect(cancelButton).toBeEnabled());
  
    // Click Cancel Registration
    userEvent.click(cancelButton);
  
    // Success message should appear
    const successAlert = await screen.findByRole('alert');
    expect(successAlert).toHaveTextContent(/successfully unregistered from the time slot/i);
  });
  it('shows correct number of available spots for a time slot', async () => {
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Spring Recruiting', description: 'Spring season', start_date: '2025-03-01', end_date: '2025-06-01' },
      ],
    });
  
    // Mock sections with a time slot that has 2 available spots
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate B',
          candidate: { first_name: 'Bob', last_name: 'Brown' },
          location: 'Campus',
          description: 'Some description',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 200,
              start_time: '2025-04-01T12:00:00Z',
              end_time: '2025-04-01T13:00:00Z',
              max_attendees: 3,
              attendees: [{ user: { id: 2 } }], // Only 1 attendee
            },
          ],
        },
      ],
    });
  
    render(<RecruitingSeasons />);
  
    // Expand Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Wait for "2 spots left" Chip to appear
    const spotsChip = await screen.findByText(/2 spots left/i);
    expect(spotsChip).toBeInTheDocument();
  });
  it('shows error message if registration fails', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Winter Recruiting', description: 'Winter season', start_date: '2025-01-01', end_date: '2025-02-28' },
      ],
    });
  
    // Mock sections with a time slot available
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate C',
          candidate: { first_name: 'Charlie', last_name: 'Clark' },
          location: 'Virtual',
          description: 'Winter description',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 300,
              start_time: '2025-01-10T14:00:00Z',
              end_time: '2025-01-10T15:00:00Z',
              max_attendees: 5,
              attendees: [],
            },
          ],
        },
      ],
    });
  
    // Make register fail (simulate API rejection)
    timeSlotsAPI.registerForTimeSlot.mockRejectedValueOnce(new Error('Server error'));
  
    render(<RecruitingSeasons />);
  
    // Expand Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Wait until "Register" button is ready
    const registerButton = await screen.findByRole('button', { name: /register/i });
    await waitFor(() => expect(registerButton).toBeEnabled());
  
    // Click Register
    userEvent.click(registerButton);
  
    // Wait for error message
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/failed to register for time slot/i);
  });
  it('shows error message if unregistration fails', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Summer Recruiting', description: 'Summer season', start_date: '2025-06-01', end_date: '2025-08-31' },
      ],
    });
  
    // Mock sections with user already registered
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate D',
          candidate: { first_name: 'Diana', last_name: 'Doe' },
          location: 'Remote',
          description: 'Summer description',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 400,
              start_time: '2025-06-15T10:00:00Z',
              end_time: '2025-06-15T11:00:00Z',
              max_attendees: 2,
              attendees: [{ user: { id: 1 } }], // User already registered
            },
          ],
        },
      ],
    });
  
    // Make unregistration fail
    timeSlotsAPI.unregisterFromTimeSlot.mockRejectedValueOnce(new Error('Server error'));
  
    render(<RecruitingSeasons />);
  
    // Expand Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Wait until "Cancel Registration" button appears
    const cancelButton = await screen.findByRole('button', { name: /cancel registration/i });
    await waitFor(() => expect(cancelButton).toBeEnabled());
  
    // Click Cancel Registration
    userEvent.click(cancelButton);
  
    // Wait for error message
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/failed to unregister from time slot/i);
  });
  it('increases available spots after successful unregistration', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Summer Recruiting', description: 'Summer season', start_date: '2025-06-01', end_date: '2025-08-31' },
      ],
    });
  
    // Mock initial sections (user registered, 0 spots left)
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate D',
          candidate: { first_name: 'Diana', last_name: 'Doe' },
          location: 'Remote',
          description: 'Summer description',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 400,
              start_time: '2025-06-15T10:00:00Z',
              end_time: '2025-06-15T11:00:00Z',
              max_attendees: 1,
              attendees: [{ user: { id: 1 } }],
            },
          ],
        },
      ],
    });
  
    // Successful unregistration
    timeSlotsAPI.unregisterFromTimeSlot.mockResolvedValueOnce();
  
    // Mock updated sections (user gone, spot opens up)
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate D',
          candidate: { first_name: 'Diana', last_name: 'Doe' },
          location: 'Remote',
          description: 'Summer description',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 400,
              start_time: '2025-06-15T10:00:00Z',
              end_time: '2025-06-15T11:00:00Z',
              max_attendees: 1,
              attendees: [],
            },
          ],
        },
      ],
    });
  
    render(<RecruitingSeasons />);
  
    // Expand Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Find and click "Cancel Registration"
    const cancelButton = await screen.findByRole('button', { name: /cancel registration/i });
    await waitFor(() => expect(cancelButton).toBeEnabled());
    userEvent.click(cancelButton);
  
    // Wait for "1 spot left" Chip to appear
    const spotsChip = await screen.findByText(/1 spot left/i);
    expect(spotsChip).toBeInTheDocument();
  });
  it('decreases available spots after successful registration', async () => {
    const { seasonsAPI, candidateSectionsAPI, timeSlotsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Spring Recruiting', description: 'Spring season', start_date: '2025-03-01', end_date: '2025-06-01' },
      ],
    });
  
    // Mock initial sections (2 spots left)
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate E',
          candidate: { first_name: 'Eve', last_name: 'Edwards' },
          location: 'On Campus',
          description: 'Springtime description',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 500,
              start_time: '2025-04-10T09:00:00Z',
              end_time: '2025-04-10T10:00:00Z',
              max_attendees: 3,
              attendees: [{ user: { id: 2 } }],
            },
          ],
        },
      ],
    });
  
    // Successful registration
    timeSlotsAPI.registerForTimeSlot.mockResolvedValueOnce();
  
    // After registering, 1 more attendee joins
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: 'Candidate E',
          candidate: { first_name: 'Eve', last_name: 'Edwards' },
          location: 'On Campus',
          description: 'Springtime description',
          needs_transportation: false,
          season: 1,
          time_slots: [
            {
              id: 500,
              start_time: '2025-04-10T09:00:00Z',
              end_time: '2025-04-10T10:00:00Z',
              max_attendees: 3,
              attendees: [{ user: { id: 2 } }, { user: { id: 1 } }], // now current user added
            },
          ],
        },
      ],
    });
  
    render(<RecruitingSeasons />);
  
    // Expand Accordion
    const accordionButton = await screen.findByRole('button', { expanded: false });
    userEvent.click(accordionButton);
  
    // Find and click "Register"
    const registerButton = await screen.findByRole('button', { name: /register/i });
    await waitFor(() => expect(registerButton).toBeEnabled());
    userEvent.click(registerButton);
  
    // Now should see "1 spot left" instead of "2 spots left"
    const spotsChip = await screen.findByText(/1 spot left/i);
    expect(spotsChip).toBeInTheDocument();
  });
  it('shows message when no candidate sections are available for a season', async () => {
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Winter Recruiting', description: 'Winter season', start_date: '2025-01-01', end_date: '2025-03-01' },
      ],
    });
  
    // Mock NO candidate sections returned
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [],
    });
  
    render(<RecruitingSeasons />);
  
    // Wait for the empty candidate section message
    const noSectionsMessage = await screen.findByText(/no candidate sections available for this recruiting season/i);
    expect(noSectionsMessage).toBeInTheDocument();
  });
  it('shows message when no candidate sections are available for a season', async () => {
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');
  
    // Mock seasons
    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Winter Recruiting', description: 'Winter season', start_date: '2025-01-01', end_date: '2025-03-01' },
      ],
    });
  
    // Mock NO candidate sections returned
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [],
    });
  
    render(<RecruitingSeasons />);
  
    // Wait for the empty candidate section message
    const noSectionsMessage = await screen.findByText(/no candidate sections available for this recruiting season/i);
    expect(noSectionsMessage).toBeInTheDocument();
  });
  
});
