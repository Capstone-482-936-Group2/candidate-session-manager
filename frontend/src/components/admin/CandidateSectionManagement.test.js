// frontend/src/components/admin/CandidateSectionManagement.test.js

// Import React and testing libraries
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CandidateSectionManagement from './CandidateSectionManagement';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

// Import the API modules BEFORE the mock setup
import { 
  seasonsAPI, 
  candidateSectionsAPI, 
  usersAPI, 
  timeSlotsAPI, 
  timeSlotTemplatesAPI, 
  facultyAvailabilityAPI 
} from '../../api/api';

// Mock the API module
jest.mock('../../api/api', () => ({
  usersAPI: {
    getUsers: jest.fn().mockResolvedValue({
      data: [
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', user_type: 'candidate', candidate_profile: { preferred_visit_dates: [] } },
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', user_type: 'candidate', candidate_profile: { preferred_visit_dates: [{ startDate: '2023-05-10', endDate: '2023-05-12' }], travel_assistance: 'all' } }
      ]
    })
  },
  seasonsAPI: {
    getSeasonById: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        title: 'Spring 2023',
        description: 'Spring recruiting season',
        start_date: '2023-01-01',
        end_date: '2023-06-30'
      }
    })
  },
  candidateSectionsAPI: {
    getCandidateSectionsBySeason: jest.fn().mockResolvedValue({
      data: []
    }),
    getCandidateSections: jest.fn().mockResolvedValue({
      data: []
    }),
    createCandidateSection: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        title: 'Session for John Doe',
        description: 'Test description',
        location: 'To be determined',
        candidate: { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        session: 1,
        needs_transportation: true,
        arrival_date: '2023-05-10',
        leaving_date: '2023-05-12',
        time_slots: []
      }
    }),
    updateCandidateSection: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        title: 'Updated Session',
        description: 'Updated description',
        location: 'To be determined',
        candidate: { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        session: 1,
        needs_transportation: true,
        arrival_date: '2023-05-10',
        leaving_date: '2023-05-12',
        time_slots: []
      }
    }),
    deleteCandidateSection: jest.fn().mockResolvedValue({}),
    getCandidateSectionById: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        title: 'Session for John Doe',
        description: 'Test description',
        location: 'To be determined',
        candidate: { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        session: 1,
        needs_transportation: true,
        arrival_date: '2023-05-10',
        leaving_date: '2023-05-12',
        time_slots: [],
        imported_availability_ids: []
      }
    })
  },
  timeSlotsAPI: {
    createTimeSlot: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        start_time: '2023-05-10T10:00:00',
        end_time: '2023-05-10T11:00:00',
        max_attendees: 1,
        location: 'Room 101',
        description: 'Meeting',
        is_visible: true,
        candidate_section: 1,
        attendees: []
      }
    }),
    updateTimeSlot: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        start_time: '2023-05-10T10:00:00',
        end_time: '2023-05-10T11:00:00',
        max_attendees: 2,
        location: 'Updated Room',
        description: 'Updated Meeting',
        is_visible: true,
        candidate_section: 1,
        attendees: []
      }
    }),
    deleteTimeSlot: jest.fn().mockResolvedValue({})
  },
  timeSlotTemplatesAPI: {
    getTemplates: jest.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Standard Meeting',
          description: 'Standard 1-hour meeting',
          start_time: '10:00',
          duration_minutes: 60,
          has_end_time: true,
          max_attendees: 1,
          is_visible: true
        }
      ]
    })
  },
  facultyAvailabilityAPI: {
    getAvailabilityByCandidate: jest.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          faculty_name: 'Prof. Smith',
          faculty_email: 'prof.smith@example.com',
          faculty_room: 'HRBB 123',
          notes: 'Available for meetings',
          time_slots: [
            { start_time: '2023-05-10T10:00:00', end_time: '2023-05-10T11:00:00' }
          ]
        }
      ]
    }),
    importAvailability: jest.fn().mockResolvedValue({
      data: {
        success: true,
        imported_slots: [
          { start_time: '2023-05-10T10:00:00', end_time: '2023-05-10T11:00:00' }
        ]
      }
    })
  }
}));

// Fix the useParams mock - this needs to be before the component import
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ seasonId: '1' }), // Return an object with seasonId directly
  Link: ({ children, ...props }) => (
    <a data-testid="mock-link" {...props}>{children}</a>
  )
}));

// Mock DateTimePicker, DatePicker components
jest.mock('@mui/x-date-pickers/DateTimePicker', () => ({
  DateTimePicker: ({ label, onChange, value }) => (
    <div data-testid={`datetime-picker-${label}`}>
      <input 
        data-testid={`datetime-input-${label}`}
        aria-label={label}
        type="text" 
        value={value ? value.toString() : ''} 
        onChange={(e) => onChange(new Date(e.target.value))} 
      />
    </div>
  )
}));

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, onChange, value }) => (
    <div data-testid={`date-picker-${label}`}>
      <input 
        data-testid={`date-input-${label}`}
        aria-label={label}
        type="text" 
        value={value ? value.toString() : ''} 
        onChange={(e) => onChange(new Date(e.target.value))} 
      />
    </div>
  )
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <div data-testid="localization-provider">{children}</div>
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: jest.fn()
}));

// Update the TemplateSelectionDialog mock
jest.mock('./TemplateSelectionDialog', () => {
  return function MockTemplateSelectionDialog({ open, onClose, onSelectTemplate, onCustomOption }) {
    if (!open) return null;
    
    return (
      <div data-testid="template-selection-dialog">
        <button 
          onClick={() => onCustomOption()} 
          data-testid="custom-time-slot-button"
        >
          Custom Time Slot
        </button>
        <div>
          <label htmlFor="numberOfSlots">Number of Slots</label>
          <input
            type="number"
            id="numberOfSlots"
            aria-label="Number of Slots"
            role="spinbutton"
            defaultValue={1}
          />
        </div>
        <button 
          onClick={() => onSelectTemplate({
            id: 1,
            name: 'Standard Meeting',
            start_time: '10:00',
            duration_minutes: 60
          }, 1, 60, 0, new Date())} 
          data-testid="use-template-button"
        >
          Use Template
        </button>
      </div>
    );
  };
});

// Mock date-fns functions
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: jest.fn().mockImplementation(() => 'Formatted Date'),
    parseISO: jest.fn().mockImplementation(str => new Date(str)),
    parseJSON: jest.fn().mockImplementation(str => new Date(str))
  };
});

// Mock window.confirm
global.confirm = jest.fn().mockImplementation(() => true);

// Mock data
const mockCandidateSection = {
  id: 1,
  title: 'Session for John Doe',
  description: 'Test description',
  location: 'To be determined',
  candidate: { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
  session: 1,
  needs_transportation: true,
  arrival_date: '2023-05-10',
  leaving_date: '2023-05-12',
  time_slots: [
    {
      id: 1,
      start_time: '2023-05-10T10:00:00',
      end_time: '2023-05-10T11:00:00',
      max_attendees: 1,
      location: 'Room 101',
      description: 'Meeting',
      is_visible: true,
      attendees: []
    }
  ],
  imported_availability_ids: []
};

// Helper function to render component with router
const renderWithRouter = (ui, { route = '/recruiting-seasons/1/candidate-sections' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/recruiting-seasons/:seasonId/candidate-sections" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

// Update the setupMocks function to properly reset all mocks
const setupMocks = () => {
  jest.clearAllMocks();
  
  // Setup default mock responses with proper structure
  seasonsAPI.getSeasonById.mockImplementation(() => Promise.resolve({
    data: {
      id: 1,
      title: 'Spring 2023',
      description: 'Spring recruiting season',
      start_date: '2023-01-01',
      end_date: '2023-06-30'
    }
  }));

  candidateSectionsAPI.getCandidateSectionsBySeason.mockImplementation(() => Promise.resolve({ 
    data: [] 
  }));
  
  usersAPI.getUsers.mockImplementation(() => Promise.resolve({
    data: [
      { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', user_type: 'candidate', candidate_profile: { preferred_visit_dates: [] } },
      { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', user_type: 'candidate', candidate_profile: { preferred_visit_dates: [{ startDate: '2023-05-10', endDate: '2023-05-12' }], travel_assistance: 'all' } }
    ]
  }));

  timeSlotTemplatesAPI.getTemplates.mockImplementation(() => Promise.resolve({
    data: [
      {
        id: 1,
        name: 'Standard Meeting',
        description: 'Standard 1-hour meeting',
        start_time: '10:00',
        duration_minutes: 60,
        has_end_time: true,
        max_attendees: 1,
        is_visible: true
      }
    ]
  }));

  // Reset window.confirm
  window.confirm = jest.fn(() => true);
};

describe('CandidateSectionManagement Component', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders loading state initially', async () => {
      renderWithRouter(<CandidateSectionManagement />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders the component with season data', async () => {
      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText('Spring 2023: Candidate Management')).toBeInTheDocument();
      });
    });

    it('shows empty state when no candidate sections exist', async () => {
      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText('No Candidate Sections')).toBeInTheDocument();
      });
    });

    it('renders candidate sections when they exist', async () => {
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [mockCandidateSection]
      });

      renderWithRouter(<CandidateSectionManagement />);
      
      // Wait for the season data to load first
      await waitFor(() => {
        expect(screen.getByText('Spring 2023: Candidate Management')).toBeInTheDocument();
      });

      // Then wait for the candidate section to appear
      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });
    });

    it('handles API errors when loading data', async () => {
      seasonsAPI.getSeasonById.mockRejectedValueOnce(new Error('Failed to load data'));
      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText(/Failed to load recruiting season data/)).toBeInTheDocument();
      });
    });
  });

  describe('Section Creation', () => {
    beforeEach(async () => {
      renderWithRouter(<CandidateSectionManagement />);
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Spring 2023: Candidate Management')).toBeInTheDocument();
      });
    });

    it('opens create dialog and handles form submission', async () => {
      await act(async () => {
        userEvent.click(screen.getByText('Add Candidate Section'));
      });

      await act(async () => {
        userEvent.click(screen.getByLabelText('Candidate'));
        userEvent.click(screen.getByText('John Doe (john@example.com)'));
        userEvent.type(screen.getByLabelText('Description'), 'Test description');
        userEvent.click(screen.getByLabelText('Candidate needs transportation'));
      });

      await act(async () => {
        userEvent.click(screen.getByText('Create Section'));
      });

      await waitFor(() => {
        expect(candidateSectionsAPI.createCandidateSection).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Session for John Doe',
            description: 'Test description',
            candidate: 1,
            needs_transportation: true
          })
        );
      });
    });

    it('validates required fields', async () => {
      await act(async () => {
        userEvent.click(screen.getByText('Add Candidate Section'));
      });

      await act(async () => {
        userEvent.click(screen.getByText('Create Section'));
      });

      expect(screen.getByText('Create Section')).toBeDisabled();
    });

    it('prevents duplicate sections for the same candidate', async () => {
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [mockCandidateSection]
      });

      await act(async () => {
        userEvent.click(screen.getByText('Add Candidate Section'));
      });

      await act(async () => {
        userEvent.click(screen.getByLabelText('Candidate'));
        userEvent.click(screen.getByText('John Doe (john@example.com)'));
        userEvent.click(screen.getByText('Create Section'));
      });

      await waitFor(() => {
        expect(screen.getByText(/This candidate already has a section/)).toBeInTheDocument();
      });
    });
  });

  describe('Section Editing', () => {
    beforeEach(async () => {
      // Set up the mock response before rendering
      candidateSectionsAPI.getCandidateSectionsBySeason.mockImplementation(() => Promise.resolve({
        data: [mockCandidateSection]
      }));

      renderWithRouter(<CandidateSectionManagement />);
      
      // Wait for both the season and section data to load
      await waitFor(() => {
        expect(screen.getByText('Spring 2023: Candidate Management')).toBeInTheDocument();
      });
    });

    it('handles date changes in edit form', async () => {
      await act(async () => {
        userEvent.click(screen.getByText('Edit'));
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
      });

      const arrivalInput = screen.getByTestId('date-input-Arrival Date');
      const leavingInput = screen.getByTestId('date-input-Leaving Date');

      await act(async () => {
        userEvent.clear(arrivalInput);
        userEvent.type(arrivalInput, '2023-06-01');
        userEvent.clear(leavingInput);
        userEvent.type(leavingInput, '2023-06-03');
      });

      await act(async () => {
        userEvent.click(screen.getByText('Update Section'));
      });

      await waitFor(() => {
        expect(candidateSectionsAPI.updateCandidateSection).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            arrival_date: '2023-06-01',
            leaving_date: '2023-06-03'
          })
        );
      });
    });
  });

  describe('Section Deletion', () => {
    beforeEach(async () => {
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [mockCandidateSection]
      });
      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('handles section deletion with confirmation', async () => {
      window.confirm.mockImplementationOnce(() => true);

      await act(async () => {
        userEvent.click(screen.getByText('Delete Section'));
      });

      await waitFor(() => {
        expect(candidateSectionsAPI.deleteCandidateSection).toHaveBeenCalledWith(1);
        expect(screen.getByText('Candidate section deleted successfully!')).toBeInTheDocument();
      });
    });

    it('cancels deletion when user declines confirmation', async () => {
      window.confirm.mockImplementationOnce(() => false);

      await act(async () => {
        userEvent.click(screen.getByText('Delete Section'));
      });

      expect(candidateSectionsAPI.deleteCandidateSection).not.toHaveBeenCalled();
    });
  });

  describe('Time Slot Management', () => {
    beforeEach(async () => {
      // Mock a section with an existing time slot
      const sectionWithTimeSlot = {
        ...mockCandidateSection,
        time_slots: [{
          id: 1,
          start_time: '2023-05-10T10:00:00',
          end_time: '2023-05-10T11:00:00'
        }]
      };

      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
        data: [sectionWithTimeSlot]
      });

      renderWithRouter(<CandidateSectionManagement />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Spring 2023: Candidate Management')).toBeInTheDocument();
      });
    });

    test('validates time slot overlap', async () => {
      // Open Add Time Slots dialog
      const addButton = await screen.findByText('Add Time Slots');
      await userEvent.click(addButton);

      // Select custom time slot option
      const customButton = await screen.findByTestId('custom-time-slot-button');
      await userEvent.click(customButton);

      // Set overlapping time
      const startTimeInput = screen.getByTestId('datetime-input-Start Time');
      await userEvent.clear(startTimeInput);
      await userEvent.type(startTimeInput, '2023-05-10T10:30:00');

      // Try to save
      const saveButton = screen.getByText('Save Time Slots');
      await userEvent.click(saveButton);

      // Check for overlap error message
      await waitFor(() => {
        expect(screen.getByText(/Time slot overlaps with existing slot/i)).toBeInTheDocument();
      });
    });

    test('successfully creates multiple time slots', async () => {
      // Click "Add Time Slots" button
      await act(async () => {
        userEvent.click(screen.getByText('Add Time Slots'));
      });

      // Click custom time slot option
      await act(async () => {
        userEvent.click(screen.getByTestId('custom-time-slot-button'));
      });

      // Add multiple time slots
      await act(async () => {
        userEvent.click(screen.getByRole('button', { name: /Add Another Time Slot/i }));
      });

      // Fill in time slot details
      const startInputs = screen.getAllByTestId('datetime-input-Start Time');
      const endInputs = screen.getAllByTestId('datetime-input-End Time');

      await act(async () => {
        userEvent.clear(startInputs[0]);
        userEvent.type(startInputs[0], '2023-05-10T09:00:00');
        userEvent.clear(endInputs[0]);
        userEvent.type(endInputs[0], '2023-05-10T10:00:00');

        userEvent.clear(startInputs[1]);
        userEvent.type(startInputs[1], '2023-05-10T10:30:00');
        userEvent.clear(endInputs[1]);
        userEvent.type(endInputs[1], '2023-05-10T11:30:00');
      });

      await act(async () => {
        userEvent.click(screen.getByText('Save Time Slots'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Successfully created 2 time slots/i)).toBeInTheDocument();
      });

      expect(timeSlotsAPI.createTimeSlot).toHaveBeenCalledTimes(2);
    });

    test('handles error when creating time slots', async () => {
      timeSlotsAPI.createTimeSlot.mockRejectedValueOnce(new Error('Failed to create time slot'));

      await act(async () => {
        userEvent.click(screen.getByText('Add Time Slots'));
      });

      await act(async () => {
        userEvent.click(screen.getByTestId('custom-time-slot-button'));
      });

      await act(async () => {
        userEvent.click(screen.getByText('Save Time Slots'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to add time slots/i)).toBeInTheDocument();
      });
    });

    test('handles time slot deletion with confirmation', async () => {
      window.confirm.mockImplementationOnce(() => true);

      // Mock a section with time slots
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [{
          ...mockCandidateSection,
          time_slots: [{
            id: 1,
            start_time: '2023-05-10T10:00:00',
            end_time: '2023-05-10T11:00:00'
          }]
        }]
      });

      renderWithRouter(<CandidateSectionManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-time-slot-1')).toBeInTheDocument();
      });

      await act(async () => {
        userEvent.click(screen.getByTestId('delete-time-slot-1'));
      });

      expect(timeSlotsAPI.deleteTimeSlot).toHaveBeenCalledWith(1);
      expect(screen.getByText('Time slot deleted successfully')).toBeInTheDocument();
    });

    test('cancels time slot deletion when user declines confirmation', async () => {
      window.confirm.mockImplementationOnce(() => false);

      // Mock a section with time slots
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [{
          ...mockCandidateSection,
          time_slots: [{
            id: 1,
            start_time: '2023-05-10T10:00:00',
            end_time: '2023-05-10T11:00:00'
          }]
        }]
      });

      renderWithRouter(<CandidateSectionManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-time-slot-1')).toBeInTheDocument();
      });

      await act(async () => {
        userEvent.click(screen.getByTestId('delete-time-slot-1'));
      });

      expect(timeSlotsAPI.deleteTimeSlot).not.toHaveBeenCalled();
    });

    test('handles error when deleting time slot', async () => {
      window.confirm.mockImplementationOnce(() => true);
      timeSlotsAPI.deleteTimeSlot.mockRejectedValueOnce(new Error('Failed to delete'));

      // Mock a section with time slots
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [{
          ...mockCandidateSection,
          time_slots: [{
            id: 1,
            start_time: '2023-05-10T10:00:00',
            end_time: '2023-05-10T11:00:00'
          }]
        }]
      });

      renderWithRouter(<CandidateSectionManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-time-slot-1')).toBeInTheDocument();
      });

      await act(async () => {
        userEvent.click(screen.getByTestId('delete-time-slot-1'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to delete time slot')).toBeInTheDocument();
      });
    });
  });

  describe('Faculty Availability Import', () => {
    beforeEach(async () => {
      candidateSectionsAPI.getCandidateSectionsBySeason.mockImplementation(() => Promise.resolve({
        data: [mockCandidateSection]
      }));

      renderWithRouter(<CandidateSectionManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Spring 2023: Candidate Management')).toBeInTheDocument();
      });
    });

    it('opens availability dialog and fetches data', async () => {
      await act(async () => {
        userEvent.click(screen.getByText('Import Availability'));
      });

      await waitFor(() => {
        expect(facultyAvailabilityAPI.getAvailabilityByCandidate).toHaveBeenCalledWith(1);
      });
    });

    it('handles successful availability import', async () => {
      // Mock successful import response
      facultyAvailabilityAPI.importAvailability.mockResolvedValueOnce({
        data: {
          success: true,
          imported_slots: [
            { start_time: '2023-05-10T10:00:00', end_time: '2023-05-10T11:00:00' }
          ]
        }
      });

      await act(async () => {
        userEvent.click(screen.getByText('Import Availability'));
      });

      // Wait for the availability data to load
      await waitFor(() => {
        expect(facultyAvailabilityAPI.getAvailabilityByCandidate).toHaveBeenCalledWith(1);
      });

      // Find and click the import button
      const importButton = screen.getByTestId('import-availability-button');
      await act(async () => {
        userEvent.click(importButton);
      });

      // Verify the import API was called
      await waitFor(() => {
        expect(facultyAvailabilityAPI.importAvailability).toHaveBeenCalled();
      });

      // Verify success message
      expect(screen.getByText(/Successfully imported availability/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API error when creating section', async () => {
      candidateSectionsAPI.createCandidateSection.mockRejectedValueOnce({
        response: { data: { detail: 'Creation failed' } }
      });

      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText('Add Candidate Section')).toBeInTheDocument();
      });

      await act(async () => {
        userEvent.click(screen.getByText('Add Candidate Section'));
      });

      await act(async () => {
        userEvent.click(screen.getByLabelText('Candidate'));
        userEvent.click(screen.getByText('John Doe (john@example.com)'));
        userEvent.click(screen.getByText('Create Section'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to create candidate section: Creation failed')).toBeInTheDocument();
      });
    });

    it('handles API error when updating section', async () => {
      candidateSectionsAPI.updateCandidateSection.mockRejectedValueOnce({
        response: { data: { detail: 'Update failed' } }
      });

      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [mockCandidateSection]
      });

      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await act(async () => {
        userEvent.click(screen.getByText('Edit'));
      });

      await act(async () => {
        userEvent.click(screen.getByText('Update Section'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update candidate section: Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Import', () => {
    it('imports candidate preferred dates successfully', async () => {
      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText('Add Candidate Section')).toBeInTheDocument();
      });

      // Open create dialog
      await act(async () => {
        userEvent.click(screen.getByText('Add Candidate Section'));
      });

      // Select candidate with preferred dates
      await act(async () => {
        // Use the Select component's button to open the dropdown
        userEvent.click(screen.getByRole('button', { name: /candidate/i }));
        // Then select the option
        userEvent.click(screen.getByText('Jane Smith (jane@example.com)'));
      });

      // Open import dialog
      await act(async () => {
        userEvent.click(screen.getByText('Import Candidate\'s Preferred Dates'));
      });

      // Select date range
      await act(async () => {
        const dateOption = screen.getByText(/May 10, 2023 to May 12, 2023/);
        userEvent.click(dateOption);
      });

      // Import dates
      await act(async () => {
        userEvent.click(screen.getByText('Import Selected Date Range'));
      });

      await waitFor(() => {
        expect(screen.getByText('Date range imported successfully')).toBeInTheDocument();
      });
    });

    it('handles missing preferred dates', async () => {
      renderWithRouter(<CandidateSectionManagement />);
      await waitFor(() => {
        expect(screen.getByText('Add Candidate Section')).toBeInTheDocument();
      });

      await act(async () => {
        userEvent.click(screen.getByText('Add Candidate Section'));
      });

      await act(async () => {
        // Use the Select component's button to open the dropdown
        userEvent.click(screen.getByRole('button', { name: /candidate/i }));
        // Then select the option
        userEvent.click(screen.getByText('John Doe (john@example.com)'));
      });

      await act(async () => {
        userEvent.click(screen.getByText('Import Candidate\'s Preferred Dates'));
      });

      await waitFor(() => {
        expect(screen.getByText('This candidate has not provided any preferred visit dates.')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Time Slots Creation', () => {
    it('creates multiple time slots from template', async () => {
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [mockCandidateSection]
      });

      renderWithRouter(<CandidateSectionManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });

      // Click "Add Time Slots" button
      await act(async () => {
        userEvent.click(screen.getByText('Add Time Slots'));
      });

      // Use template
      await act(async () => {
        userEvent.click(screen.getByTestId('use-template-button'));
      });

      await waitFor(() => {
        expect(timeSlotsAPI.createTimeSlot).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields in time slot form', async () => {
      // Set up mock data with a candidate section
      candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValueOnce({
        data: [mockCandidateSection]
      });

      renderWithRouter(<CandidateSectionManagement />);
      
      // Wait for the component to load and find the Add Time Slots button
      const addButton = await screen.findByText('Add Time Slots');
      expect(addButton).toBeInTheDocument();

      // Click the Add Time Slots button and wait for dialog
      await act(async () => {
        userEvent.click(addButton);
      });

      // Wait for and verify the dialog is open
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Click custom time slot option
      const customButton = await screen.findByTestId('custom-time-slot-button');
      await act(async () => {
        userEvent.click(customButton);
      });

      // Find and click the save button
      const saveButton = await screen.findByText('Save Time Slots');
      await act(async () => {
        userEvent.click(saveButton);
      });

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });
  });
});
