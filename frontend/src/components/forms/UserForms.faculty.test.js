import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import UserForms from './UserForms';
import { useAuth } from '../../context/AuthContext';
import userEvent from '@testing-library/user-event';
// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the API calls
jest.mock('../../api/api', () => ({
  get: jest.fn(),
  seasonsAPI: {
    getSeasons: jest.fn().mockResolvedValue({ data: [] }),
    getSeasonById: jest.fn().mockResolvedValue({ data: { title: 'Test Season' } })
  },
  candidateSectionsAPI: {
    getCandidateSectionsBySeason: jest.fn().mockResolvedValue({ data: [] }),
    getCandidateSectionById: jest.fn().mockResolvedValue({ data: {} })
  },
  availabilityInvitationAPI: {
    getInvitations: jest.fn().mockResolvedValue({ data: [] })
  },
  facultyAvailabilityAPI: {
    getAvailabilityByCandidate: jest.fn().mockResolvedValue({ data: [] })
  }
}));

// Create a theme for MUI
const theme = createTheme();

// Wrapper component for providing necessary contexts
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('UserForms - Faculty View', () => {
  // Setup before each test
  beforeEach(() => {
    // Mock faculty user by default
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'faculty' }
    });
  });

  // Clear all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display faculty availability section when user is faculty', async () => {
    render(<UserForms />, { wrapper: AllTheProviders });

    // Check if faculty availability section is present
    const facultySection = await screen.findByText('Faculty Availability Form');
    expect(facultySection).toBeInTheDocument();
  });

  it('should prompt user to select a candidate when no candidate is selected', async () => {
    render(<UserForms />, { wrapper: AllTheProviders });

    // It should say please select a candidate because no candidate is selected yet
    const promptText = await screen.findByText(/Please select a candidate/i);
    expect(promptText).toBeInTheDocument();
  });
  it('should open candidate selection dialog when Select Candidate button is clicked', async () => {
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // First find and click the accordion header to expand it
    const accordionButton = await screen.findByText('Faculty Availability Form');
    accordionButton.click();
  
    // Now find and click the Select Candidate button
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    expect(selectButton).toBeInTheDocument();
  
    // Click the button
    selectButton.click();
  
    // After clicking, a dialog should open with title 'Select a Candidate'
    const dialogTitle = await screen.findByText(/Select a Candidate/i);
    expect(dialogTitle).toBeInTheDocument();
  });
  it('should list candidate options when invitations are returned', async () => {
    // Mock invitations to have at least one candidate
    const invitationsMock = [{ candidate_section: 123 }];
    const candidateSectionMock = {
      id: 123,
      candidate: { first_name: 'John', last_name: 'Doe' },
      seasonName: 'Spring 2025'
    };
  
    // Override mocks temporarily
    const { availabilityInvitationAPI, candidateSectionsAPI, seasonsAPI } = require('../../api/api');
    availabilityInvitationAPI.getInvitations.mockResolvedValueOnce({ data: invitationsMock });
    candidateSectionsAPI.getCandidateSectionById.mockResolvedValueOnce({ data: candidateSectionMock });
    seasonsAPI.getSeasonById.mockResolvedValueOnce({ data: { title: 'Spring 2025' } });
  
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // First find and click the accordion header to expand it
    const accordionButton = await screen.findByText('Faculty Availability Form');
    await userEvent.click(accordionButton);
  
    // Now find and click the Select Candidate button
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    await userEvent.click(selectButton);
  
    // Now a candidate should show up in the dialog
    const candidateOption = await screen.findByText(/John Doe/i);
    expect(candidateOption).toBeInTheDocument();
  });
  it('should select a candidate and display their name after selection', async () => {
    // Mock invitations to have one candidate
    const invitationsMock = [{ candidate_section: 456 }];
    const candidateSectionMock = {
      id: 456,
      candidate: { first_name: 'Jane', last_name: 'Smith' },
      seasonName: 'Fall 2025',
      arrival_date: '2025-09-01T00:00:00Z',
      leaving_date: '2025-09-05T00:00:00Z'
    };
  
    // Override mocks for this test
    const { availabilityInvitationAPI, candidateSectionsAPI, seasonsAPI } = require('../../api/api');
    availabilityInvitationAPI.getInvitations.mockResolvedValueOnce({ data: invitationsMock });
    candidateSectionsAPI.getCandidateSectionById.mockResolvedValueOnce({ data: candidateSectionMock });
    seasonsAPI.getSeasonById.mockResolvedValueOnce({ data: { title: 'Fall 2025' } });
  
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // First find and click the accordion header to expand it
    const accordionButton = await screen.findByText('Faculty Availability Form');
    await userEvent.click(accordionButton);
  
    // Now find and click the Select Candidate button
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    await userEvent.click(selectButton);
  
    // Wait for candidate to appear
    const candidateOption = await screen.findByText(/Jane Smith/i);
    expect(candidateOption).toBeInTheDocument();
  
    // Click the candidate
    await userEvent.click(candidateOption);
  
    // After selecting, the dialog should close, and candidate's name should appear in the main form
    const availabilityHeader = await screen.findByText(/Availability for Jane Smith/i);
    expect(availabilityHeader).toBeInTheDocument();
  });
  it('should allow adding a time slot after selecting a candidate', async () => {
    // Mock candidate selection
    const invitationsMock = [{ candidate_section: 789 }];
    const candidateSectionMock = {
      id: 789,
      candidate: { first_name: 'Alex', last_name: 'Johnson' },
      seasonName: 'Winter 2025',
      arrival_date: '2025-12-01T00:00:00Z',
      leaving_date: '2025-12-10T00:00:00Z'
    };
  
    const { availabilityInvitationAPI, candidateSectionsAPI, seasonsAPI } = require('../../api/api');
    availabilityInvitationAPI.getInvitations.mockResolvedValueOnce({ data: invitationsMock });
    candidateSectionsAPI.getCandidateSectionById.mockResolvedValueOnce({ data: candidateSectionMock });
    seasonsAPI.getSeasonById.mockResolvedValueOnce({ data: { title: 'Winter 2025' } });
  
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // First find and click the accordion header to expand it
    const accordionButton = await screen.findByText('Faculty Availability Form');
    await userEvent.click(accordionButton);
  
    // Now open candidate selection dialog
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    await userEvent.click(selectButton);
  
    // Select the candidate
    const candidateOption = await screen.findByText(/Alex Johnson/i);
    await userEvent.click(candidateOption);
  
    // Wait for the availability form to show
    const availabilityHeader = await screen.findByText(/Availability for Alex Johnson/i);
    expect(availabilityHeader).toBeInTheDocument();
  
    // Click Add Time Slot button
    const addTimeSlotButton = await screen.findByRole('button', { name: /Add Time Slot/i });
    await userEvent.click(addTimeSlotButton);
  
    // Now we expect at least one Start Time picker to show
    const startTimeInput = await screen.findByLabelText(/Start Time/i);
    const endTimeInput = await screen.findByLabelText(/End Time/i);
  
    expect(startTimeInput).toBeInTheDocument();
    expect(endTimeInput).toBeInTheDocument();
  });
  it('should show submit button disabled when no time slots are added', async () => {
    // Mock a candidate
    const invitationsMock = [{ candidate_section: 111 }];
    const candidateSectionMock = {
      id: 111,
      candidate: { first_name: 'Empty', last_name: 'Slots' },
      seasonName: 'Now'
    };
  
    // Override mocks
    const { availabilityInvitationAPI, candidateSectionsAPI, seasonsAPI } = require('../../api/api');
    availabilityInvitationAPI.getInvitations.mockResolvedValueOnce({ data: invitationsMock });
    candidateSectionsAPI.getCandidateSectionById.mockResolvedValueOnce({ data: candidateSectionMock });
    seasonsAPI.getSeasonById.mockResolvedValueOnce({ data: { title: 'Now' } });
  
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // First find and click the accordion header to expand it
    const accordionButton = await screen.findByText('Faculty Availability Form');
    await userEvent.click(accordionButton);
  
    // Select a candidate first
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    await userEvent.click(selectButton);
    
    const candidateOption = await screen.findByText(/Empty Slots/i);
    await userEvent.click(candidateOption);
  
    // Find the submit button
    const submitButton = await screen.findByRole('button', { name: /Submit Availability/i });
    
    // Check that the button has the disabled class or style
    expect(submitButton).toHaveClass('Mui-disabled');
    // Or if using a data attribute for disabled state:
    // expect(submitButton).toHaveAttribute('aria-disabled', 'true');
  });
  it('should allow typing into the Additional Notes field', async () => {
    // Mock a candidate
    const invitationsMock = [{ candidate_section: 321 }];
    const candidateSectionMock = {
      id: 321,
      candidate: { first_name: 'Notes', last_name: 'Tester' },
      seasonName: 'Test Season'
    };
  
    const { availabilityInvitationAPI, candidateSectionsAPI, seasonsAPI } = require('../../api/api');
    availabilityInvitationAPI.getInvitations.mockResolvedValueOnce({ data: invitationsMock });
    candidateSectionsAPI.getCandidateSectionById.mockResolvedValueOnce({ data: candidateSectionMock });
    seasonsAPI.getSeasonById.mockResolvedValueOnce({ data: { title: 'Test Season' } });
  
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // Expand the accordion
    const accordionButton = await screen.findByText('Faculty Availability Form');
    await userEvent.click(accordionButton);
  
    // Select a candidate
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    await userEvent.click(selectButton);
  
    const candidateOption = await screen.findByText(/Notes Tester/i);
    await userEvent.click(candidateOption);
  
    // Now find the notes field
    const notesField = await screen.findByLabelText(/Additional Notes/i);
    expect(notesField).toBeInTheDocument();
  
    // Type into the notes field
    await userEvent.type(notesField, 'This is a test note.');
  
    // Assert that the value updated
    expect(notesField).toHaveValue('This is a test note.');
  });
  it('should expand and collapse existing submission details', async () => {
    // Mock a candidate with existing submissions
    const invitationsMock = [{ candidate_section: 654 }];
    const candidateSectionMock = {
      id: 654,
      candidate: { first_name: 'Expand', last_name: 'Collapse' },
      seasonName: 'Test Season'
    };
    const existingSubmissionsMock = [
      {
        id: 1,
        faculty: 1,
        time_slots: [
          {
            start_time: '2025-05-01T10:00:00Z',
            end_time: '2025-05-01T11:00:00Z'
          }
        ],
        notes: 'First submission',
        created_at: '2025-04-20T12:00:00Z'
      }
    ];
  
    const { availabilityInvitationAPI, candidateSectionsAPI, seasonsAPI, facultyAvailabilityAPI } = require('../../api/api');
    availabilityInvitationAPI.getInvitations.mockResolvedValueOnce({ data: invitationsMock });
    candidateSectionsAPI.getCandidateSectionById.mockResolvedValueOnce({ data: candidateSectionMock });
    seasonsAPI.getSeasonById.mockResolvedValueOnce({ data: { title: 'Test Season' } });
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockResolvedValueOnce({ data: existingSubmissionsMock });
  
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // Expand accordion
    const accordionButton = await screen.findByText('Faculty Availability Form');
    await userEvent.click(accordionButton);
  
    // Select candidate
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    await userEvent.click(selectButton);
  
    const candidateOption = await screen.findByText(/Expand Collapse/i);
    await userEvent.click(candidateOption);
  
    // Find the previous submission text
    const previousSubmission = await screen.findByText(/1 time slot\(s\) submitted/i);
    expect(previousSubmission).toBeInTheDocument();
  
    // Click to expand
    await userEvent.click(previousSubmission);
  
    // Expect to find Time Slots details
    const startTimeDetail = await screen.findByText(/Start:/i);
    const endTimeDetail = await screen.findByText(/End:/i);
    expect(startTimeDetail).toBeInTheDocument();
    expect(endTimeDetail).toBeInTheDocument();
  
    // Click again to collapse
    await userEvent.click(previousSubmission);
  
    // After collapsing, the details should disappear
    expect(startTimeDetail).not.toBeVisible();
    expect(endTimeDetail).not.toBeVisible();
  });
  it('should delete an existing availability submission and show success message', async () => {
    // Mock a candidate with an existing submission
    const invitationsMock = [{ candidate_section: 987 }];
    const candidateSectionMock = {
      id: 987,
      candidate: { first_name: 'Delete', last_name: 'Me' },
      seasonName: 'Test Season'
    };
    const existingSubmissionsMock = [
      {
        id: 2,
        faculty: 1,
        time_slots: [
          {
            start_time: '2025-05-01T10:00:00Z',
            end_time: '2025-05-01T11:00:00Z'
          }
        ],
        notes: 'Submission to delete',
        created_at: '2025-04-22T12:00:00Z'
      }
    ];
  
    const { availabilityInvitationAPI, candidateSectionsAPI, seasonsAPI, facultyAvailabilityAPI } = require('../../api/api');
    availabilityInvitationAPI.getInvitations.mockResolvedValueOnce({ data: invitationsMock });
    candidateSectionsAPI.getCandidateSectionById.mockResolvedValueOnce({ data: candidateSectionMock });
    seasonsAPI.getSeasonById.mockResolvedValueOnce({ data: { title: 'Test Season' } });
    facultyAvailabilityAPI.getAvailabilityByCandidate.mockResolvedValueOnce({ data: existingSubmissionsMock });
    facultyAvailabilityAPI.deleteAvailability = jest.fn().mockResolvedValueOnce({});
  
    render(<UserForms />, { wrapper: AllTheProviders });
  
    // Expand the accordion
    const accordionButton = await screen.findByText('Faculty Availability Form');
    await userEvent.click(accordionButton);
  
    // Select candidate
    const selectButton = await screen.findByRole('button', { name: /Select Candidate/i });
    await userEvent.click(selectButton);
  
    const candidateOption = await screen.findByText(/Delete Me/i);
    await userEvent.click(candidateOption);
  
    // Expand submission details
    const previousSubmission = await screen.findByText(/1 time slot\(s\) submitted/i);
    await userEvent.click(previousSubmission);
  
    // Find the delete button by its icon
    const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
    await userEvent.click(deleteButton);
  
    // Should show success snackbar
    const successMessage = await screen.findByText(/Availability submission deleted successfully/i);
    expect(successMessage).toBeInTheDocument();
});


});
describe('UserForms - Admin View', () => {
  beforeEach(() => {
    // No resetModules, no re-mocking context
    const { seasonsAPI, candidateSectionsAPI } = require('../../api/api');

    // Override user type for Admin
    useAuth.mockReturnValue({
      currentUser: { id: 1, user_type: 'admin' }
    });

    seasonsAPI.getSeasons.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Spring 2025' }]
    });

    candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
      data: [{ id: 1, candidate: { first_name: 'John', last_name: 'Doe' } }]
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render RecruitingSeasons and CandidateSections when user is admin', async () => {
    render(<UserForms />, { wrapper: AllTheProviders });

    const recruitingSeasonsHeading = await screen.findByText(/Recruiting Seasons/i);
    expect(recruitingSeasonsHeading).toBeInTheDocument();

    const candidateSectionsHeading = await screen.findByText(/Candidate Sections/i);
    expect(candidateSectionsHeading).toBeInTheDocument();
  });
});


