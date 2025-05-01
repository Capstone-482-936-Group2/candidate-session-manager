import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateSelectionDialog from './TemplateSelectionDialog';
import { timeSlotTemplatesAPI, locationsAPI } from '../../api/api';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock the APIs
jest.mock('../../api/api', () => ({
  timeSlotTemplatesAPI: {
    getTemplates: jest.fn()
  },
  locationsAPI: {
    getLocations: jest.fn()
  }
}));

describe('TemplateSelectionDialog', () => {
  const mockTemplates = [
    {
      id: 1,
      name: 'Template 1',
      description: 'Description 1',
      duration_minutes: 60,
      max_attendees: 1,
      has_end_time: true,
      is_visible: true,
      use_location_type: true,
      location_type: 1
    },
    {
      id: 2,
      name: 'Template 2',
      description: 'Description 2',
      duration_minutes: 30,
      max_attendees: 2,
      has_end_time: false,
      is_visible: false,
      use_location_type: false,
      location: 'Room A'
    }
  ];

  const mockLocations = [
    { id: 1, name: 'Location 1', location_type: 1 },
    { id: 2, name: 'Location 2', location_type: 1 }
  ];

  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onSelectTemplate: jest.fn(),
    onCustomOption: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    timeSlotTemplatesAPI.getTemplates.mockResolvedValue({ data: mockTemplates });
    locationsAPI.getLocations.mockResolvedValue({ data: mockLocations });
  });

  const renderWithProvider = (component) => {
    return render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {component}
      </LocalizationProvider>
    );
  };

  it('renders loading state initially', () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);
    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('renders templates after loading', async () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
      expect(screen.getByText('Template 2')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    timeSlotTemplatesAPI.getTemplates.mockRejectedValueOnce(new Error('Failed to load'));
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
    });
  });

  it('displays empty state when no templates', async () => {
    timeSlotTemplatesAPI.getTemplates.mockResolvedValueOnce({ data: [] });
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('No templates found. Create a template first or use custom option.')).toBeInTheDocument();
    });
  });

  it('handles template selection', async () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
    });

    // Click on a template
    fireEvent.click(screen.getByText('Template 1'));

    // Verify template details are shown
    expect(screen.getByText('Select Different Template')).toBeInTheDocument();
    expect(screen.getByText('Configure Time Slots')).toBeInTheDocument();
  });

  it('handles custom option selection', async () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Or Create Custom Time Slot')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Or Create Custom Time Slot'));
    expect(mockProps.onCustomOption).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles template configuration and submission', async () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
    });

    // Select template
    fireEvent.click(screen.getByText('Template 1'));

    // Configure slots
    const numberOfSlotsInput = screen.getByLabelText(/number of slots/i);
    fireEvent.change(numberOfSlotsInput, { target: { value: '3' } });

    const daysBetweenInput = screen.getByLabelText(/days between slots/i);
    fireEvent.change(daysBetweenInput, { target: { value: '1' } });

    // Select location for template with location type
    const locationSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(locationSelect);
    
    // Wait for the options to be available in the dropdown
    await waitFor(() => {
      const locationOption = screen.getByText('Location 1');
      fireEvent.click(locationOption);
    });

    // Submit template
    fireEvent.click(screen.getByRole('button', { name: /use template/i }));

    expect(mockProps.onSelectTemplate).toHaveBeenCalledWith(
      mockTemplates[0],
      3,
      0,
      1,
      expect.any(Date),
      1
    );
  });

  it('validates minimum interval minutes when days is 0', async () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
    });

    // Select template
    fireEvent.click(screen.getByText('Template 1'));

    // Try to set minutes below minimum
    const minutesInput = screen.getByLabelText(/minutes between slots/i);
    fireEvent.change(minutesInput, { target: { value: '10' } });

    // Should enforce minimum of 15 minutes
    expect(minutesInput).toHaveValue(15);
  });

  it('disables minutes input when days interval is set', async () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
    });

    // Select template
    fireEvent.click(screen.getByText('Template 1'));

    // Set days interval
    const daysInput = screen.getByLabelText(/days between slots/i);
    fireEvent.change(daysInput, { target: { value: '1' } });

    // Minutes should be set to 0
    const minutesInput = screen.getByLabelText(/minutes between slots/i);
    expect(minutesInput).toHaveValue(0);
  });

  it('handles dialog close', async () => {
    renderWithProvider(<TemplateSelectionDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
