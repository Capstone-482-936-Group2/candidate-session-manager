import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Typography, Paper, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import './SessionCalendar.css';

const SessionCalendar = ({ candidateSections, currentUser, onRegister, onUnregister }) => {
  // Add state for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Process candidate sections into calendar events
  const events = candidateSections.flatMap(section => {
    // Debug - log all time slots with visibility status
    console.log('Time slots for', section.candidate?.first_name, section.time_slots?.map(s => ({
      id: s.id,
      visible: s.is_visible,
      start: s.start_time
    })));

    return section.time_slots
      ?.filter(slot => {
        // Only show slots where is_visible is true
        return slot.is_visible !== false; // This handles undefined/null cases too
      })
      .map(slot => {
        // Debug detailed information about each slot
        console.log('Slot data:', {
          id: slot.id,
          is_visible: slot.is_visible,
          hasProperty: 'is_visible' in slot
        });
        
        // Temporarily show all slots until backend is fixed
        const isFull = slot.attendees?.length >= slot.max_attendees;
        const isRegistered = slot.attendees?.some(attendee => attendee?.user?.id === currentUser?.id);
        
        // Create event with appropriate colors based on status
        return {
          id: slot.id.toString(),
          title: `${section.candidate?.first_name || ''} ${section.candidate?.last_name || ''}`,
          start: slot.start_time,
          end: slot.end_time || null,
          backgroundColor: isFull ? '#2196f3' : '#4caf50',  // Blue if full, green if available
          borderColor: isRegistered ? '#ff9800' : (isFull ? '#1976d2' : '#388e3c'),
          textColor: 'white',
          classNames: [
            isFull ? 'full-slot' : 'available-slot',
            isRegistered ? 'registered-slot' : ''
          ],
          extendedProps: {
            slot: slot,
            section: section,
            attendees: slot.attendees || [],
            isFull: isFull,
            isRegistered: isRegistered,
            description: slot.description,
            location: slot.location
          }
        };
      }) || []; // Empty array fallback
  });

  // Event render handling for consistent styling across all views
  const eventDidMount = (info) => {
    // Ensure consistent styling across all views
    const { isFull, isRegistered } = info.event.extendedProps;
    
    // Apply styles directly to DOM element to ensure they work in month view
    if (isFull) {
      info.el.style.backgroundColor = '#2196f3'; // Blue for full slots
    } else {
      info.el.style.backgroundColor = '#4caf50'; // Green for available slots
    }
    
    if (isRegistered) {
      info.el.style.borderLeft = '4px solid #ff9800'; // Orange border for registered slots
      info.el.style.borderRight = '4px solid #ff9800';
      info.el.style.borderTop = '1px solid #ff9800';
      info.el.style.borderBottom = '1px solid #ff9800';
    }
  };

  const handleEventClick = (info) => {
    const { slot, isRegistered, isFull } = info.event.extendedProps;
    
    if (isRegistered) {
      // Instead of confirm, open dialog
      setDialogAction('unregister');
      setSelectedTimeSlot(slot);
      setDialogOpen(true);
    } else if (!isFull) {
      // Instead of confirm, open dialog
      setDialogAction('register');
      setSelectedTimeSlot(slot);
      setDialogOpen(true);
    }
  };

  const handleDialogConfirm = () => {
    if (dialogAction === 'register' && selectedTimeSlot) {
      onRegister(selectedTimeSlot.id);
    } else if (dialogAction === 'unregister' && selectedTimeSlot) {
      onUnregister(selectedTimeSlot.id);
    }
    setDialogOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const renderEventContent = (eventInfo) => {
    // Event-specific data - note: section is unused but we'll keep it for potential future use
    const { slot, attendees, isFull, isRegistered } = eventInfo.event.extendedProps;
    
    return (
      <Tooltip title={
        <Box>
          <Typography variant="subtitle2">{eventInfo.event.title}</Typography>
          {slot.location && <Typography variant="body2">Location: {slot.location}</Typography>}
          {slot.description && <Typography variant="body2">{slot.description}</Typography>}
          <Typography variant="body2">
            {isFull ? 'Full' : `${attendees.length}/${slot.max_attendees} slots filled`}
          </Typography>
          {attendees.length > 0 && (
            <>
              <Typography variant="body2" sx={{ mt: 1 }}>Attendees:</Typography>
              {attendees.map(a => (
                <Typography key={a.id} variant="body2" sx={{ pl: 1 }}>
                  • {a.user?.first_name || ''} {a.user?.last_name || ''}
                </Typography>
              ))}
            </>
          )}
          {isRegistered && <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>You are registered</Typography>}
        </Box>
      }>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {eventInfo.timeText} - {eventInfo.event.title}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {isFull ? 'Full' : `${attendees.length}/${slot.max_attendees}`}
            {isRegistered && ' ✓'}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <>
      <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="timeGridWeek"
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventDidMount={eventDidMount}
          height="100%"
        />
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogAction === 'register' ? 'Register for Time Slot' : 'Unregister from Time Slot'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogAction === 'register' 
              ? 'Do you want to register for this time slot?' 
              : 'Do you want to unregister from this time slot?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogConfirm} color="primary" autoFocus>
            {dialogAction === 'register' ? 'Register' : 'Unregister'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionCalendar;
