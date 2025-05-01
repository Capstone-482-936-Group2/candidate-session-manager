import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FacultyAvailabilitySubmissions from './FacultyAvailabilitySubmissions';
import { facultyAvailabilityAPI, candidateSectionsAPI } from '../../api/api';
import userEvent from '@testing-library/user-event';

// Mock the APIs
jest.mock('../../api/api', () => ({
  facultyAvailabilityAPI: {
    getAvailabilityByCandidate: jest.fn(),
  },
  candidateSectionsAPI: {
    getCandidateSections: jest.fn(),
  },
}));

describe('FacultyAvailabilitySubmissions', () => {
  const mockCandidateSections = [
    {
      id: 1,
      title: 'Morning Session',
      candidate: { email: 'candidate1@example.com' }
    },
    {
      id: 2,
      title: 'Afternoon Session',
      candidate: { email: 'candidate2@example.com' }
    }
  ];

  const mockSubmissions = [
    {
      id: 1,
      faculty_name: 'Dr. Smith',
      faculty_email: 'smith@university.edu',
      faculty_room: 'Room 101',
      submitted_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      time_slots: [
        {
          start_time: '2024-01-02T09:00:00Z',
          end_time: '2024-01-02T10:00:00Z'
        }
      ],
      notes: 'Available for morning meetings'
    },
    {
      id: 2,
      faculty_name: 'Dr. Johnson',
      faculty_email: 'johnson@university.edu',
      faculty_room: 'Room 202',
      submitted_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z',
      time_slots: [
        {
          start_time: '2024-01-02T14:00:00Z',
          end_time: '2024-01-02T15:00:00Z'
        }
      ],
      notes: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state with candidate section dropdown', async () => {
    candidateSectionsAPI.getCandidateSections.mockResolvedValue({ data: mockCandidateSections });

    await act(async () => {
      render(<FacultyAvailabilitySubmissions />);
    });

    // Check for the select component using role
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Click the select to open options
    await act(async () => {
      fireEvent.mouseDown(select);
    });

    // Wait for the popup to be visible and check options
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'candidate1@example.com - Morning Session' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'candidate2@example.com - Afternoon Session' })).toBeInTheDocument();
    });

    // Should show initial message
    expect(screen.getByText('Please select a candidate to view faculty availability submissions')).toBeInTheDocument();
  });

  it('displays loading state when fetching submissions', async () => {
    candidateSectionsAPI.getCandidateSections.mockResolvedValue({ data: mockCandidateSections });
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: mockSubmissions }), 100))
    );

    await act(async () => {
      render(<FacultyAvailabilitySubmissions />);
    });

    // Select a candidate
    const select = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.mouseDown(select);
    });
    
    const option = await screen.findByText('candidate1@example.com - Morning Session');
    await act(async () => {
      fireEvent.click(option);
    });

    // Check for loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('displays faculty submissions after selecting a candidate', async () => {
    candidateSectionsAPI.getCandidateSections.mockResolvedValue({ data: mockCandidateSections });
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockResolvedValue({ data: mockSubmissions });

    await act(async () => {
      render(<FacultyAvailabilitySubmissions />);
    });

    // Select a candidate
    const select = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.mouseDown(select);
    });
    
    const option = await screen.findByRole('option', { name: 'candidate1@example.com - Morning Session' });
    await act(async () => {
      fireEvent.click(option);
    });

    // Check for submission data
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('smith@university.edu')).toBeInTheDocument();
      expect(screen.getByText(/Room: Room 101/)).toBeInTheDocument();
      expect(screen.getByText('Available for morning meetings')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('handles empty submissions', async () => {
    candidateSectionsAPI.getCandidateSections.mockResolvedValue({ data: mockCandidateSections });
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockResolvedValue({ data: [] });

    await act(async () => {
      render(<FacultyAvailabilitySubmissions />);
    });

    // Select a candidate
    const select = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.mouseDown(select);
    });
    
    const option = await screen.findByText('candidate1@example.com - Morning Session');
    await act(async () => {
      fireEvent.click(option);
    });

    // Check for empty state message
    await waitFor(() => {
      expect(screen.getByText('No faculty availability submissions for this candidate')).toBeInTheDocument();
    });
  });

  it('handles API errors for candidate sections', async () => {
    candidateSectionsAPI.getCandidateSections.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(<FacultyAvailabilitySubmissions />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load candidate sections')).toBeInTheDocument();
    });
  });

  it('handles API errors for submissions', async () => {
    candidateSectionsAPI.getCandidateSections.mockResolvedValue({ data: mockCandidateSections });
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(<FacultyAvailabilitySubmissions />);
    });

    // Select a candidate
    const select = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.mouseDown(select);
    });
    
    const option = await screen.findByText('candidate1@example.com - Morning Session');
    await act(async () => {
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load faculty availability submissions')).toBeInTheDocument();
    });
  });
});
