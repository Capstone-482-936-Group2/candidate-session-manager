// frontend/src/components/admin/AdminDashboard.test.js

// Mock axios before anything else to prevent import errors
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock the S3Test component
jest.mock('../tests/S3Test', () => () => <div data-testid="s3-test">S3Test Mock</div>);

// Mock all child components
jest.mock('./UserManagement', () => () => <div data-testid="user-management">User Management Mock</div>);
jest.mock('./RecruitingSeasonManagement', () => () => <div data-testid="season-management">Season Management Mock</div>);
jest.mock('./TimeSlotTemplateManagement', () => () => <div data-testid="timeslot-management">Time Slot Templates Mock</div>);
jest.mock('./LocationManagement', () => () => <div data-testid="location-management">Location Management Mock</div>);
jest.mock('../../pages/FormManagement', () => () => <div data-testid="form-management">Form Management Mock</div>);

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(() => ({ pathname: '/admin' }))
}));

// Import React and testing libraries
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with title and description', () => {
    render(<AdminDashboard />);
    
    // Check title and description
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage users, seasons, time slots, locations, and forms')).toBeInTheDocument();
  });

  test('renders all tabs', () => {
    render(<AdminDashboard />);
    
    // Check all tab labels
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Season Management')).toBeInTheDocument();
    expect(screen.getByText('Time Slot Templates')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Form Management')).toBeInTheDocument();
  });

  test('User Management tab is selected by default', () => {
    render(<AdminDashboard />);
    
    // Check UserManagement component is rendered
    expect(screen.getByTestId('user-management')).toBeInTheDocument();
    
    // Other components should not be in the document
    expect(screen.queryByTestId('season-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('timeslot-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('location-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('form-management')).not.toBeInTheDocument();
  });

  test('switching to Season Management tab works', () => {
    render(<AdminDashboard />);
    
    // Click on the Season Management tab
    fireEvent.click(screen.getByText('Season Management'));
    
    // Check RecruitingSeasonManagement component is rendered
    expect(screen.getByTestId('season-management')).toBeInTheDocument();
    
    // Other components should not be visible
    expect(screen.queryByTestId('user-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('timeslot-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('location-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('form-management')).not.toBeInTheDocument();
  });

  test('switching to Time Slot Templates tab works', () => {
    render(<AdminDashboard />);
    
    // Click on the Time Slot Templates tab
    fireEvent.click(screen.getByText('Time Slot Templates'));
    
    // Check TimeSlotTemplateManagement component is rendered
    expect(screen.getByTestId('timeslot-management')).toBeInTheDocument();
    
    // Other components should not be visible
    expect(screen.queryByTestId('user-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('season-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('location-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('form-management')).not.toBeInTheDocument();
  });

  test('switching to Locations tab works', () => {
    render(<AdminDashboard />);
    
    // Click on the Locations tab
    fireEvent.click(screen.getByText('Locations'));
    
    // Check LocationManagement component is rendered
    expect(screen.getByTestId('location-management')).toBeInTheDocument();
    
    // Other components should not be visible
    expect(screen.queryByTestId('user-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('season-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('timeslot-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('form-management')).not.toBeInTheDocument();
  });

  test('switching to Form Management tab works', () => {
    render(<AdminDashboard />);
    
    // Click on the Form Management tab
    fireEvent.click(screen.getByText('Form Management'));
    
    // Check FormManagement component is rendered
    expect(screen.getByTestId('form-management')).toBeInTheDocument();
    
    // Other components should not be visible
    expect(screen.queryByTestId('user-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('season-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('timeslot-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('location-management')).not.toBeInTheDocument();
  });

  test('TabPanel component correctly shows/hides content', () => {
    render(<AdminDashboard />);
    
    // First tab should be visible initially
    expect(screen.getByTestId('user-management')).toBeInTheDocument();
    
    // Switch to another tab
    fireEvent.click(screen.getByText('Locations'));
    
    // Now the locations tab should be visible and user management hidden
    expect(screen.getByTestId('location-management')).toBeInTheDocument();
    expect(screen.queryByTestId('user-management')).not.toBeInTheDocument();
    
    // Switch back to the first tab
    fireEvent.click(screen.getByText('User Management'));
    
    // First tab should be visible again
    expect(screen.getByTestId('user-management')).toBeInTheDocument();
    expect(screen.queryByTestId('location-management')).not.toBeInTheDocument();
  });

  test('renders with correct styling and icons', () => {
    render(<AdminDashboard />);
    
    // The component should have Material-UI elements
    const paper = screen.getByRole('tabpanel');
    expect(paper).toBeInTheDocument();
    
    // Tabs should have icons
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });
});
