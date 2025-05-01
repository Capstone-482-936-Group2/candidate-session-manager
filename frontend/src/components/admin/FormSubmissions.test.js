import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormSubmissions from './FormSubmissions';
import api from '../../api/api';
import userEvent from '@testing-library/user-event';

// Mock the API
jest.mock('../../api/api', () => ({
  get: jest.fn()
}));

describe('FormSubmissions', () => {
  const mockForm = {
    id: 1,
    form_fields: [
      {
        id: 1,
        label: 'Name',
        type: 'text',
        help_text: 'Enter your full name'
      },
      {
        id: 2,
        label: 'Available Dates',
        type: 'date_range',
        help_text: 'Select your availability'
      },
      {
        id: 3,
        label: 'Interests',
        type: 'checkbox',
        help_text: 'Select your research interests'
      },
      {
        id: 4,
        label: 'Start Date',
        type: 'date',
        help_text: 'Preferred start date'
      }
    ]
  };

  const mockSubmissions = [
    {
      id: 1,
      submitted_by: { email: 'test@example.com' },
      submitted_at: '2024-01-01T10:00:00Z',
      is_completed: true,
      answers: {
        1: 'John Doe',
        2: { startDate: '2024-02-01', endDate: '2024-02-15' },
        3: ['Research', 'Teaching'],
        4: '2024-03-01'
      }
    },
    {
      id: 2,
      submitted_by: { email: 'user2@example.com' },
      submitted_at: '2024-01-02T11:00:00Z',
      is_completed: false,
      answers: {
        1: 'Jane Smith',
        2: null,
        3: ['Research'],
        4: null
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Wrap the render and initial data fetching in act
  const renderWithAct = async (component) => {
    await act(async () => {
      render(component);
    });
  };

  it('renders loading state initially', async () => {
    // Mock API to delay response to ensure we can test loading state
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: mockForm });
          }, 100);
        });
      }
      if (url.includes('/form-submissions/')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: mockSubmissions });
          }, 100);
        });
      }
    });

    render(<FormSubmissions formId="1" />);
    
    // Check for loading state immediately
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for loading to complete to clean up
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('displays form submissions after loading', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.resolve({ data: mockForm });
      }
      if (url.includes('/form-submissions/')) {
        return Promise.resolve({ data: mockSubmissions });
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Available Dates')).toBeInTheDocument();
    expect(screen.getByText('Interests')).toBeInTheDocument();

    // Check submission data
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Research, Teaching')).toBeInTheDocument();
  });

  it('handles empty submissions', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.resolve({ data: mockForm });
      }
      if (url.includes('/form-submissions/')) {
        return Promise.resolve({ data: [] });
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    });
  });

  it('displays error when form fails to load', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.reject(new Error('Failed to load'));
      }
      if (url.includes('/form-submissions/')) {
        return Promise.resolve({ data: [] });
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Form not found')).toBeInTheDocument();
    });
  });

  it('displays error when submissions fail to load', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.resolve({ data: mockForm });
      }
      if (url.includes('/form-submissions/')) {
        return Promise.reject(new Error('Failed to load'));
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load submissions')).toBeInTheDocument();
    });
  });

  it('formats date range values correctly', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.resolve({ data: mockForm });
      }
      if (url.includes('/form-submissions/')) {
        return Promise.resolve({ data: mockSubmissions });
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      expect(screen.getByText('2/1/2024 - 2/15/2024')).toBeInTheDocument();
    });
  });

  it('displays completion status chips correctly', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.resolve({ data: mockForm });
      }
      if (url.includes('/form-submissions/')) {
        return Promise.resolve({ data: mockSubmissions });
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  it('shows field help text in tooltips', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.resolve({ data: mockForm });
      }
      if (url.includes('/form-submissions/')) {
        return Promise.resolve({ data: mockSubmissions });
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      const nameHeader = screen.getByText('Name');
      // Check for aria-label instead of title for tooltip content
      expect(nameHeader).toHaveAttribute('aria-label', 'Enter your full name');
    });
  });

  it('handles null or missing answer values', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/forms/')) {
        return Promise.resolve({ data: mockForm });
      }
      if (url.includes('/form-submissions/')) {
        return Promise.resolve({ data: mockSubmissions });
      }
    });

    await renderWithAct(<FormSubmissions formId="1" />);

    await waitFor(() => {
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });
});
