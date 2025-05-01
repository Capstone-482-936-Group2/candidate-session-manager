import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionCalendar from './SessionCalendar';
import { ThemeProvider, createTheme } from '@mui/material';

// Mock FullCalendar to avoid actual rendering
jest.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: function MockCalendar({ events, eventClick, eventContent }) {
    return (
      <div data-testid="fullcalendar">
        {events.map((event) => (
          <div
            key={event.id}
            data-testid={`calendar-event-${event.id}`}
            onClick={() => eventClick({ event })}
          >
            {/* Render event content directly */}
            <div data-testid={`event-content-${event.id}`}>
              {eventContent({ event, timeText: '10:00 AM' })}
            </div>
          </div>
        ))}
      </div>
    );
  }
}));

const theme = createTheme();

const mockCandidateSections = [
  {
    id: 1,
    candidate: {
      first_name: 'John',
      last_name: 'Doe'
    },
    time_slots: [
      {
        id: 1,
        start_time: '2024-03-20T10:00:00',
        end_time: '2024-03-20T11:00:00',
        is_visible: true,
        max_attendees: 3,
        attendees: [],
        description: 'Test session',
        location: 'Room 101'
      }
    ]
  }
];

const mockCurrentUser = {
  id: 1,
  first_name: 'Test',
  last_name: 'User'
};

describe('SessionCalendar', () => {
  const mockOnRegister = jest.fn();
  const mockOnUnregister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar with events', () => {
    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={mockCandidateSections}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-event-1')).toBeInTheDocument();
  });

  it('opens registration dialog when clicking available event', async () => {
    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={mockCandidateSections}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('calendar-event-1'));
    
    expect(screen.getByText('John Doe', { selector: '.MuiTypography-h5' })).toBeInTheDocument();
    expect(screen.getByText('Register for This Session')).toBeInTheDocument();
  });

  it('handles registration confirmation', async () => {
    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={mockCandidateSections}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('calendar-event-1'));
    fireEvent.click(screen.getByText('Register for This Session'));

    expect(mockOnRegister).toHaveBeenCalledWith(1);
  });

  it('shows full status for events at capacity', () => {
    const fullSection = {
      ...mockCandidateSections[0],
      time_slots: [{
        ...mockCandidateSections[0].time_slots[0],
        attendees: Array(3).fill({ id: 1, user: { id: 2 } })
      }]
    };

    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={[fullSection]}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('calendar-event-1'));
    expect(screen.getByText('FULL')).toBeInTheDocument();
  });

  it('shows registered status for user\'s events', () => {
    const registeredSection = {
      ...mockCandidateSections[0],
      time_slots: [{
        ...mockCandidateSections[0].time_slots[0],
        attendees: [{ id: 1, user: { id: 1 } }]
      }]
    };

    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={[registeredSection]}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('calendar-event-1'));
    expect(screen.getByText('REGISTERED')).toBeInTheDocument();
  });

  it('handles unregistration', async () => {
    const registeredSection = {
      ...mockCandidateSections[0],
      time_slots: [{
        ...mockCandidateSections[0].time_slots[0],
        attendees: [{ id: 1, user: { id: 1 } }]
      }]
    };

    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={[registeredSection]}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('calendar-event-1'));
    fireEvent.click(screen.getByText('Unregister from This Session'));

    expect(mockOnUnregister).toHaveBeenCalledWith(1);
  });

  it('displays event details correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={mockCandidateSections}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('calendar-event-1'));
    
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('Test session')).toBeInTheDocument();
    expect(screen.getByText('Attendees (0/3)')).toBeInTheDocument();
  });

  it('filters out invisible time slots', () => {
    const sectionWithInvisibleSlot = {
      ...mockCandidateSections[0],
      time_slots: [{
        ...mockCandidateSections[0].time_slots[0],
        is_visible: false
      }]
    };

    render(
      <ThemeProvider theme={theme}>
        <SessionCalendar
          candidateSections={[sectionWithInvisibleSlot]}
          currentUser={mockCurrentUser}
          onRegister={mockOnRegister}
          onUnregister={mockOnUnregister}
        />
      </ThemeProvider>
    );

    expect(screen.queryByTestId('calendar-event-1')).not.toBeInTheDocument();
  });
}); 