import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import RecruitingSeasonManagement from './RecruitingSeasonManagement';
import { seasonsAPI, candidateSectionsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock the APIs
jest.mock('../../api/api', () => ({
  seasonsAPI: {
    getSeasons: jest.fn(),
    createSeason: jest.fn(),
    deleteSeason: jest.fn()
  },
  candidateSectionsAPI: {
    getCandidateSections: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('RecruitingSeasonManagement', () => {
  const mockSeasons = [
    {
      id: 1,
      title: 'Fall 2023',
      description: 'Fall recruiting season',
      start_date: '2023-09-01',
      end_date: '2023-12-31'
    },
    {
      id: 2,
      title: 'Spring 2024',
      description: 'Spring recruiting season',
      start_date: '2024-01-01',
      end_date: '2024-05-31'
    }
  ];

  const mockCandidateSections = [
    {
      id: 1,
      session: { id: 1 },
      seasonId: 1
    },
    {
      id: 2,
      session: { id: 1 },
      seasonId: 1
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    seasonsAPI.getSeasons.mockResolvedValue({ data: mockSeasons });
    candidateSectionsAPI.getCandidateSections.mockResolvedValue({ data: mockCandidateSections });
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'admin' }
    });
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  const renderWithProviders = (component) => {
    return render(
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {component}
        </LocalizationProvider>
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    renderWithProviders(<RecruitingSeasonManagement />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders seasons after loading', async () => {
    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.getByText('Fall 2023')).toBeInTheDocument();
      expect(screen.getByText('Spring 2024')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    seasonsAPI.getSeasons.mockRejectedValueOnce(new Error('Failed to load'));
    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load recruiting seasons data/)).toBeInTheDocument();
    });
  });

  it('displays empty state when no seasons', async () => {
    seasonsAPI.getSeasons.mockResolvedValueOnce({ data: [] });
    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.getByText('No Recruiting Seasons')).toBeInTheDocument();
    });
  });

  it('opens create season dialog', async () => {
    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Use a more specific selector for the button
    fireEvent.click(screen.getByRole('button', { name: /add new season/i }));
    
    // Check for dialog title
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Check for input fields
    expect(screen.getByRole('textbox', { name: /season title/i })).toBeInTheDocument();
  });

  it('handles season creation', async () => {
    const newSeason = {
      title: 'Summer 2024',
      description: 'Summer recruiting season',
      start_date: '2024-06-01',
      end_date: '2024-08-31'
    };

    seasonsAPI.createSeason.mockResolvedValueOnce({ data: { id: 3, ...newSeason } });

    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /add new season/i }));

    // Fill form using more specific selectors
    fireEvent.change(screen.getByRole('textbox', { name: /season title/i }), {
      target: { value: newSeason.title }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: newSeason.description }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create season/i }));

    await waitFor(() => {
      expect(seasonsAPI.createSeason).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Recruiting season created successfully!')).toBeInTheDocument();
    });
  });

  it('handles season deletion', async () => {
    seasonsAPI.deleteSeason.mockResolvedValueOnce({});

    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Season' });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(seasonsAPI.deleteSeason).toHaveBeenCalledWith(mockSeasons[0].id);
      expect(screen.getByText('Recruiting season deleted successfully')).toBeInTheDocument();
    });
  });

  it('displays correct candidate count', async () => {
    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // The first season should show 2 candidates based on mockCandidateSections
    expect(screen.getByText('2 Candidates')).toBeInTheDocument();
  });

  it('cancels season deletion when user clicks cancel', async () => {
    window.confirm.mockImplementationOnce(() => false);
    
    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Season' });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(seasonsAPI.deleteSeason).not.toHaveBeenCalled();
  });

  it('handles season creation API error', async () => {
    const error = new Error('Failed to create');
    error.response = { data: { detail: 'Invalid dates' } };
    seasonsAPI.createSeason.mockRejectedValueOnce(error);

    renderWithProviders(<RecruitingSeasonManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open dialog and submit
    fireEvent.click(screen.getByText('Add New Season'));
    fireEvent.click(screen.getByRole('button', { name: 'Create Season' }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create recruiting season/)).toBeInTheDocument();
    });
  });
});
