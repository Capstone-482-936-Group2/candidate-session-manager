import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeSlotTemplateManagement from './TimeSlotTemplateManagement';
import { timeSlotTemplatesAPI, locationTypesAPI, locationsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock the APIs
jest.mock('../../api/api', () => ({
  timeSlotTemplatesAPI: {
    getTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn()
  },
  locationTypesAPI: {
    getLocationTypes: jest.fn()
  },
  locationsAPI: {
    getLocations: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('TimeSlotTemplateManagement', () => {
  const mockTemplates = [
    {
      id: 1,
      name: 'Test Template 1',
      description: 'Test Description 1',
      start_time: '09:00',
      duration_minutes: 60,
      max_attendees: 1,
      use_location_type: false,
      custom_location: 'Room 101',
      location: null,
      location_type: null,
      notes: 'Test notes',
      is_visible: true,
      has_end_time: true
    }
  ];

  const mockLocationTypes = [
    { id: 1, name: 'Office' },
    { id: 2, name: 'Conference Room' }
  ];

  const mockLocations = [
    { id: 1, name: 'Room A', location_type: 1 },
    { id: 2, name: 'Room B', location_type: 2 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    timeSlotTemplatesAPI.getTemplates.mockResolvedValue({ data: mockTemplates });
    locationTypesAPI.getLocationTypes.mockResolvedValue({ data: mockLocationTypes });
    locationsAPI.getLocations.mockResolvedValue({ data: mockLocations });
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'admin' }
    });
  });

  const renderWithProvider = (component) => {
    return render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {component}
      </LocalizationProvider>
    );
  };

  it('renders loading state initially', () => {
    renderWithProvider(<TimeSlotTemplateManagement />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders templates after loading', async () => {
    renderWithProvider(<TimeSlotTemplateManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Template 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
  });

  it('handles API error', async () => {
    timeSlotTemplatesAPI.getTemplates.mockRejectedValueOnce(new Error('Failed to load'));
    renderWithProvider(<TimeSlotTemplateManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
    });
  });

  it('opens create template dialog', async () => {
    renderWithProvider(<TimeSlotTemplateManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Template'));
    expect(screen.getByRole('dialog')).toHaveTextContent('Create New Template');
  });

  it('handles template creation', async () => {
    const newTemplate = {
      name: 'New Template',
      description: 'New Description',
      duration_minutes: 30,
      max_attendees: 2,
      custom_location: 'New Room',
      is_visible: true,
      has_end_time: true
    };

    timeSlotTemplatesAPI.createTemplate.mockResolvedValueOnce({ data: { id: 2, ...newTemplate } });

    renderWithProvider(<TimeSlotTemplateManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Template'));

    // Fill form
    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: newTemplate.name }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: newTemplate.description }
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: newTemplate.duration_minutes }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create template/i }));

    await waitFor(() => {
      expect(timeSlotTemplatesAPI.createTemplate).toHaveBeenCalled();
    });

    expect(await screen.findByText('Template created successfully')).toBeInTheDocument();
  });

  it('handles template deletion', async () => {
    timeSlotTemplatesAPI.deleteTemplate.mockResolvedValueOnce({});
    window.confirm = jest.fn(() => true);

    renderWithProvider(<TimeSlotTemplateManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(timeSlotTemplatesAPI.deleteTemplate).toHaveBeenCalledWith(mockTemplates[0].id);
    });

    expect(await screen.findByText('Template deleted successfully')).toBeInTheDocument();
  });

  it('handles template editing', async () => {
    renderWithProvider(<TimeSlotTemplateManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open edit dialog
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Verify form is populated with template data
    expect(screen.getByLabelText(/template name/i)).toHaveValue(mockTemplates[0].name);
    expect(screen.getByLabelText(/description/i)).toHaveValue(mockTemplates[0].description);

    // Make changes
    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: 'Updated Template' }
    });

    // Submit changes
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(timeSlotTemplatesAPI.updateTemplate).toHaveBeenCalledWith(
        mockTemplates[0].id,
        expect.objectContaining({ name: 'Updated Template' })
      );
    });

    expect(await screen.findByText('Template updated successfully')).toBeInTheDocument();
  });
});
