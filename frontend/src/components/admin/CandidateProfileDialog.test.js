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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from './AdminDashboard';
import { usersAPI } from '../../api/api';
import CandidateProfileDialog from './CandidateProfileDialog';

// Mock the API calls
jest.mock('../../api/api', () => ({
  usersAPI: {
    getUsers: jest.fn(),
    getUser: jest.fn()
  }
}));

// Mock the API_BASE_URL
jest.mock('../../config', () => ({
  API_BASE_URL: 'http://test-api'
}));

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useTheme: () => ({
    palette: {
      primary: { main: '#500000' },
      secondary: { main: '#5c068c' }
    },
    shadows: ['none'],
    alpha: () => 'rgba(0,0,0,0.1)'
  })
}));

// Sample candidate data for testing
const mockCandidate = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  candidate_profile: {
    current_title: 'PhD Student',
    current_institution: 'Test University',
    current_department: 'Computer Science',
    cell_number: '123-456-7890',
    research_interests: 'AI and Machine Learning',
    talk_title: 'Test Talk',
    abstract: 'Test Abstract',
    headshot_url: '/media/headshots/test.jpg',
    preferred_visit_dates: [
      { startDate: '2024-03-01', endDate: '2024-03-02' },
      { startDate: '2024-03-15', endDate: '2024-03-16' }
    ],
    preferred_faculty: ['faculty1', 'faculty2'],
    food_preferences: ['Vegetarian'],
    dietary_restrictions: ['No nuts'],
    travel_assistance: 'Yes',
    preferred_airport: 'TEST',
    passport_name: 'John Doe',
    date_of_birth: '1990-01-01',
    gender: 'male',
    known_traveler_number: '12345',
    frequent_flyer_info: 'AA123456',
    country_of_residence: 'USA'
  }
};

// Mock faculty data
const mockFacultyData = {
  data: [
    { id: 'faculty1', first_name: 'Faculty', last_name: 'One' },
    { id: 'faculty2', first_name: 'Faculty', last_name: 'Two' }
  ]
};

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

describe('CandidateProfileDialog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful faculty data fetch
    usersAPI.getUsers.mockResolvedValue(mockFacultyData);
  });

  it('renders basic candidate information correctly', () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    // Use more specific selectors
    expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('displays professional information correctly', () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    // Check professional information
    expect(screen.getByText('PhD Student')).toBeInTheDocument();
    expect(screen.getByText('Test University')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
  });

  it('displays research and talk information correctly', () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    expect(screen.getByText('AI and Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Test Talk')).toBeInTheDocument();
    expect(screen.getByText('Test Abstract')).toBeInTheDocument();
  });

  it('handles headshot display and download correctly', async () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    // Check if headshot is displayed
    const headshot = screen.getByAltText('Candidate Headshot');
    expect(headshot).toBeInTheDocument();
    expect(headshot.src).toContain('http://test-api/media/headshots/test.jpg');

    // Test download button
    const downloadButton = screen.getByText('Download');
    expect(downloadButton).toBeInTheDocument();
  });

  it('displays preferred visit dates correctly', () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    // Create date objects for comparison
    const date1 = new Date('2024-03-01');
    const date2 = new Date('2024-03-15');

    // Get the localized date strings
    const date1String = date1.toLocaleDateString();
    const date2String = date2.toLocaleDateString();

    // Look for the dates in the rendered content
    const dateElements = screen.getAllByText((content) => {
      return content.includes(date1String) || content.includes(date2String);
    });

    // Verify we found at least one element containing each date
    expect(dateElements.length).toBeGreaterThan(0);
    expect(dateElements.some(el => el.textContent.includes(date1String))).toBeTruthy();
    expect(dateElements.some(el => el.textContent.includes(date2String))).toBeTruthy();
  });

  it('displays dietary information correctly', () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('No nuts')).toBeInTheDocument();
  });

  it('displays travel information correctly', () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    // Test each piece of travel information separately
    expect(screen.getByText('TEST')).toBeInTheDocument(); // preferred airport
    
    // Use getAllByText and check the specific one we want
    const passportNameElements = screen.getAllByText('John Doe');
    expect(passportNameElements.some(element => 
      element.closest('div')?.textContent.includes('Passport Name')
    )).toBeTruthy();
    
    expect(screen.getByText('12345')).toBeInTheDocument(); // known traveler number
    expect(screen.getByText('AA123456')).toBeInTheDocument(); // frequent flyer info
    expect(screen.getByText('USA')).toBeInTheDocument(); // country of residence
  });

  it('fetches and displays faculty names correctly', async () => {
    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Faculty One')).toBeInTheDocument();
      expect(screen.getByText('Faculty Two')).toBeInTheDocument();
    });
  });

  it('handles missing candidate profile data gracefully', () => {
    const candidateWithoutProfile = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com'
    };

    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={candidateWithoutProfile}
      />
    );

    // Check for "Not provided" messages
    const notProvidedElements = screen.getAllByText('Not provided');
    expect(notProvidedElements.length).toBeGreaterThan(0);
  });

  it('handles close button click', () => {
    const onCloseMock = jest.fn();
    render(
      <CandidateProfileDialog
        open={true}
        onClose={onCloseMock}
        candidate={mockCandidate}
      />
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('handles faculty data fetch error gracefully', async () => {
    usersAPI.getUsers.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <CandidateProfileDialog
        open={true}
        onClose={() => {}}
        candidate={mockCandidate}
      />
    );

    // Check for the header instead of the full name
    expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
  });
});
