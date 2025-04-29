import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import FacultyAvailabilityForm from './FacultyAvailabilityForm';
import { useAuth } from '../../context/AuthContext';
import { seasonsAPI, candidateSectionsAPI, facultyAvailabilityAPI } from '../../api/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API module
jest.mock('../../api/api', () => ({
  seasonsAPI: {
    getSeasons: jest.fn(),
  },
  candidateSectionsAPI: {
    getCandidateSectionsBySeason: jest.fn(),
  },
  facultyAvailabilityAPI: {
    submitAvailability: jest.fn(),
    deleteAvailability: jest.fn(),
    getAvailabilityByCandidate: jest.fn(),
  },
}));

describe('FacultyAvailabilityForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth context
    useAuth.mockReturnValue({ currentUser: { id: 1 } });

    // Mock API responses
    seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ 
        id: 1, 
        title: 'Spring 2025',
        start_date: '2025-01-01',
        end_date: '2025-12-31' 
      }]
    });
    
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [{
        id: 1,
        candidate: { 
          id: 1, 
          first_name: 'LeBron', 
          last_name: 'James' 
        },
        arrival_date: '2025-01-01',
        leaving_date: '2025-01-05'
      }]
    });
    
    facultyAvailabilityAPI.submitAvailability.mockResolvedValue({});
    facultyAvailabilityAPI.deleteAvailability.mockResolvedValue({});
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockResolvedValue({ 
      data: [] 
    });
  });

  test('renders form title after loading', async () => {
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );
    
    // Wait for loading to finish and the title to appear
    await waitFor(() => {
      expect(screen.getByText(/faculty availability form/i)).toBeInTheDocument();
    });
  });

  test('shows recruiting season selection text after loading', async () => {
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText(/select a recruiting season/i)).toBeInTheDocument();
    });
  });

  test('renders Select a Recruiting Season after loading seasons', async () => {
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );
    
    const selectText = await screen.findByText(/select a recruiting season/i);
    expect(selectText).toBeInTheDocument();
  });

  test('displays candidates after selecting a season', async () => {
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );

    // Wait for "Spring 2025" season to load
    const seasonName = await screen.findByText(/spring 2025/i);
    expect(seasonName).toBeInTheDocument();

    // Click on the nearby "Select" button
    const selectButtons = await screen.findAllByRole('button', { name: /select/i });
    expect(selectButtons.length).toBeGreaterThan(0);

    fireEvent.click(selectButtons[0]);

    // After clicking, candidates should load
    const candidate = await screen.findByText(/lebron james/i);
    expect(candidate).toBeInTheDocument();
  });
  test('shows error message when loading seasons fails', async () => {
    // Make the API fail
    seasonsAPI.getSeasons.mockRejectedValueOnce(new Error('Failed to fetch seasons'));

    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );

    // Wait for the error message to appear
    const error = await screen.findByText(/failed to load recruiting seasons/i);
    expect(error).toBeInTheDocument();
  });
  test('allows adding a time slot after selecting a candidate', async () => {
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );

    // Wait for and select the season
    const seasonName = await screen.findByText(/spring 2025/i);
    expect(seasonName).toBeInTheDocument();
    const selectButtons = await screen.findAllByRole('button', { name: /select/i });
    fireEvent.click(selectButtons[0]);

    // Wait for and select the candidate
    const candidate = await screen.findByText(/lebron james/i);
    expect(candidate).toBeInTheDocument();
    const candidateSelectButtons = await screen.findAllByRole('button', { name: /select/i });
    fireEvent.click(candidateSelectButtons[0]);

    // Wait for the "Add Time Slot" button and click it
    const addTimeSlotButton = await screen.findByRole('button', { name: /add time slot/i });
    fireEvent.click(addTimeSlotButton);

    // Check that a "Start Time" field is now present
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    // Check that an "End Time" field is now present
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
  });
  test('shows error if deleting availability submission fails', async () => {
    // Mock API failure when trying to delete availability
    facultyAvailabilityAPI.deleteAvailability.mockRejectedValueOnce(new Error('Server error'));
  
    // Also mock existing submissions so a Delete button appears
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockResolvedValueOnce({
      data: [
        {
          id: 123,
          submitted_at: '2025-01-01T12:00:00Z',
          notes: 'Sample note',
          time_slots: [
            {
              start_time: '2025-01-02T10:00:00Z',
              end_time: '2025-01-02T11:00:00Z'
            }
          ],
          faculty: 1, // same as currentUser.id
        }
      ]
    });
  
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );
  
    // Wait for and select the season
    fireEvent.click(await screen.findByRole('button', { name: /select/i }));
  
    // Wait for and select the candidate
    fireEvent.click(await screen.findByRole('button', { name: /select/i }));
  
    // Now, existing submissions should appear with a Delete button
    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
  
    // After clicking delete, wait for the error snackbar to appear
    await waitFor(async () => {
      expect(await screen.findByText(/failed to delete submission/i)).toBeInTheDocument();
    });
  });
  
  test('shows error if trying to submit with start time after end time', async () => {
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );
  
    // Select season
    fireEvent.click(await screen.findByRole('button', { name: /select/i }));
  
    // Select candidate
    fireEvent.click(await screen.findByRole('button', { name: /select/i }));
  
    // Add a time slot
    const addTimeSlotButton = await screen.findByRole('button', { name: /add time slot/i });
    fireEvent.click(addTimeSlotButton);
  
    // Fill invalid times
    const startTimeInput = await screen.findByLabelText(/start time/i);
    const endTimeInput = await screen.findByLabelText(/end time/i);
  
    fireEvent.change(startTimeInput, { target: { value: '01/03/2025 2:00 PM' } });
    fireEvent.change(endTimeInput, { target: { value: '01/03/2025 1:00 PM' } });
  
    // Click Submit
    fireEvent.click(await screen.findByRole('button', { name: /submit availability/i }));
  
    // Wait for the snackbar with error
    await waitFor(async () => {
      expect(await screen.findByText(/cannot be after/i)).toBeInTheDocument();
    });
  });
  test('shows empty state when no candidates are available for a season', async () => {
    // Mock candidateSectionsAPI to return empty
    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: []
    });
  
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );
  
    // Select season
    fireEvent.click(await screen.findByRole('button', { name: /select/i }));
  
    // Wait for the empty state alert
    const emptyAlert = await screen.findByText(/no candidates found for this season/i);
    expect(emptyAlert).toBeInTheDocument();
  });
  
  test('clicking Cancel returns to candidate list', async () => {
    render(
      <MemoryRouter>
        <FacultyAvailabilityForm />
      </MemoryRouter>
    );
  
    // Select season
    fireEvent.click(await screen.findByRole('button', { name: /select/i }));
  
    // Select candidate
    fireEvent.click(await screen.findByRole('button', { name: /select/i }));
  
    // Confirm you are on the Add Availability screen
    expect(await screen.findByText(/add new availability/i)).toBeInTheDocument();
  
    // Click Cancel
    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
  
    // After canceling, candidate list should reappear
    const selectCandidateText = await screen.findByText(/select a candidate/i);
    expect(selectCandidateText).toBeInTheDocument();
  });
  
  
  
});