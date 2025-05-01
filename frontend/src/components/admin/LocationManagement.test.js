import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationManagement from './LocationManagement';
import { locationTypesAPI, locationsAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

// Mock the APIs
jest.mock('../../api/api', () => ({
  locationTypesAPI: {
    getLocationTypes: jest.fn(),
    createLocationType: jest.fn(),
    updateLocationType: jest.fn(),
    deleteLocationType: jest.fn()
  },
  locationsAPI: {
    getLocations: jest.fn(),
    createLocation: jest.fn(),
    updateLocation: jest.fn(),
    deleteLocation: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('LocationManagement', () => {
  const mockLocationTypes = [
    {
      id: 1,
      name: 'Office',
      description: 'Office spaces'
    },
    {
      id: 2,
      name: 'Conference Room',
      description: 'Meeting rooms'
    }
  ];

  const mockLocations = [
    {
      id: 1,
      name: 'Room 101',
      description: 'First floor office',
      location_type: 1,
      address: 'Building A',
      notes: 'Near elevator'
    },
    {
      id: 2,
      name: 'Main Conference Room',
      description: 'Large conference room',
      location_type: 2,
      address: 'Building B',
      notes: 'Projector available'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    locationTypesAPI.getLocationTypes.mockResolvedValue({ data: mockLocationTypes });
    locationsAPI.getLocations.mockResolvedValue({ data: mockLocations });
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'admin' }
    });
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  it('renders loading state initially', () => {
    render(<LocationManagement />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders location types tab after loading', async () => {
    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.getByText('Office')).toBeInTheDocument();
      expect(screen.getByText('Conference Room')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Click on Locations tab
    fireEvent.click(screen.getByRole('tab', { name: /locations/i }));
    expect(screen.getByText('Room 101')).toBeInTheDocument();

    // Click back to Location Types tab
    fireEvent.click(screen.getByRole('tab', { name: /location types/i }));
    expect(screen.getByText('Office')).toBeInTheDocument();
  });

  it('opens create location type dialog', async () => {
    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add location type/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /type name/i })).toBeInTheDocument();
  });

  it('handles location type creation', async () => {
    const newLocationType = {
      name: 'Lab',
      description: 'Laboratory space'
    };

    locationTypesAPI.createLocationType.mockResolvedValueOnce({ data: { id: 3, ...newLocationType } });

    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open dialog and fill form
    fireEvent.click(screen.getByRole('button', { name: /add location type/i }));
    
    fireEvent.change(screen.getByRole('textbox', { name: /type name/i }), {
      target: { value: newLocationType.name }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: newLocationType.description }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(locationTypesAPI.createLocationType).toHaveBeenCalledWith(newLocationType);
      expect(screen.getByText('Location type created successfully')).toBeInTheDocument();
    });
  });

  it('handles location type deletion', async () => {
    locationTypesAPI.deleteLocationType.mockResolvedValueOnce({});

    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(locationTypesAPI.deleteLocationType).toHaveBeenCalledWith(mockLocationTypes[0].id);
      expect(screen.getByText('Location type deleted successfully')).toBeInTheDocument();
    });
  });

  it('handles location creation', async () => {
    const newLocation = {
      name: 'New Room',
      description: 'New office space',
      location_type: 1,
      address: 'Building C',
      notes: 'Ground floor'
    };

    locationsAPI.createLocation.mockResolvedValueOnce({ data: { id: 3, ...newLocation } });

    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to Locations tab
    fireEvent.click(screen.getByRole('tab', { name: /locations/i }));

    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /add location/i }));

    // Fill form
    fireEvent.change(screen.getByRole('textbox', { name: /location name/i }), {
      target: { value: newLocation.name }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: newLocation.description }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /address/i }), {
      target: { value: newLocation.address }
    });
    fireEvent.change(screen.getByRole('textbox', { name: /notes/i }), {
      target: { value: newLocation.notes }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(locationsAPI.createLocation).toHaveBeenCalledWith(newLocation);
      expect(screen.getByText('Location created successfully')).toBeInTheDocument();
    });
  });

  it('handles location deletion', async () => {
    locationsAPI.deleteLocation.mockResolvedValueOnce({});

    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to Locations tab
    fireEvent.click(screen.getByRole('tab', { name: /locations/i }));

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(locationsAPI.deleteLocation).toHaveBeenCalledWith(mockLocations[0].id);
      expect(screen.getByText('Location deleted successfully')).toBeInTheDocument();
    });
  });

  it('displays empty state when no location types', async () => {
    locationTypesAPI.getLocationTypes.mockResolvedValueOnce({ data: [] });
    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.getByText('No Location Types Available')).toBeInTheDocument();
    });
  });

  it('displays empty state when no locations', async () => {
    locationsAPI.getLocations.mockResolvedValueOnce({ data: [] });
    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Switch to Locations tab
    fireEvent.click(screen.getByRole('tab', { name: /locations/i }));
    expect(screen.getByText('No Locations Available')).toBeInTheDocument();
  });
});
