/**
 * Interactive calendar component for displaying and managing candidate interview sessions.
 * Allows users to view, register for, and unregister from available time slots.
 */
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Box, 
  Typography, 
  Paper, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  IconButton,
  Avatar,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import './SessionCalendar.css';

/**
 * Calendar component that displays candidate interview sessions and manages registration.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.candidateSections - Array of candidate sections with time slots
 * @param {Object} props.currentUser - Current authenticated user object
 * @param {Function} props.onRegister - Callback function when user registers for a session
 * @param {Function} props.onUnregister - Callback function when user unregisters from a session
 * @returns {React.ReactNode} Calendar interface with registration dialogs
 */
const SessionCalendar = ({ candidateSections, currentUser, onRegister, onUnregister }) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Process candidate sections into calendar events
  const events = candidateSections.flatMap(section => {
    return section.time_slots
      ?.filter(slot => {
        // Only show slots where is_visible is true
        return slot.is_visible !== false; // This handles undefined/null cases too
      })
      .map(slot => {
        // Temporarily show all slots until backend is fixed
        const isFull = slot.attendees?.length >= slot.max_attendees;
        const isRegistered = slot.attendees?.some(attendee => attendee?.user?.id === currentUser?.id);
        
        // Create event with appropriate colors based on status
        return {
          id: slot.id.toString(),
          title: `${section.candidate?.first_name || ''} ${section.candidate?.last_name || ''}`,
          start: slot.start_time,
          end: slot.end_time || null,
          backgroundColor: isRegistered ? theme.palette.secondary.main : (isFull ? '#9e9e9e' : theme.palette.primary.main),
          borderColor: isRegistered ? theme.palette.secondary.dark : (isFull ? '#757575' : theme.palette.primary.dark),
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

  /**
   * Applies consistent styling to calendar events across all views.
   * Called by FullCalendar when each event is mounted in the DOM.
   * 
   * @param {Object} info - Event information provided by FullCalendar
   */
  const eventDidMount = (info) => {
    // Ensure consistent styling across all views
    const { isFull, isRegistered } = info.event.extendedProps;
    
    // Apply styles directly to DOM element to ensure they work in month view
    if (isRegistered) {
      info.el.style.backgroundColor = theme.palette.secondary.main;
      info.el.style.borderLeft = `4px solid ${theme.palette.secondary.dark}`;
    } else if (isFull) {
      info.el.style.backgroundColor = '#9e9e9e';
      info.el.style.opacity = '0.8';
    } else {
      info.el.style.backgroundColor = theme.palette.primary.main;
      info.el.style.borderLeft = `4px solid ${theme.palette.primary.dark}`;
    }
    
    // Add rounded corners
    info.el.style.borderRadius = '4px';
    // Add subtle shadow
    info.el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
  };

  /**
   * Handles click events on calendar time slots.
   * Opens appropriate dialog based on slot status (available, full, registered).
   * 
   * @param {Object} info - Event information provided by FullCalendar
   */
  const handleEventClick = (info) => {
    const { slot, isRegistered, isFull } = info.event.extendedProps;
    
    // Store the event for the dialog
    setSelectedEvent(info.event);
    setSelectedTimeSlot(slot);
    
    if (isRegistered) {
      setDialogAction('unregister');
      setDialogOpen(true);
    } else if (!isFull) {
      setDialogAction('register');
      setDialogOpen(true);
    } else {
      // Just show details if the slot is full and user isn't registered
      setDialogAction('view');
      setDialogOpen(true);
    }
  };

  /**
   * Processes the user's confirmation in the dialog.
   * Calls appropriate registration or unregistration handler.
   */
  const handleDialogConfirm = () => {
    if (dialogAction === 'register' && selectedTimeSlot) {
      onRegister(selectedTimeSlot.id);
    } else if (dialogAction === 'unregister' && selectedTimeSlot) {
      onUnregister(selectedTimeSlot.id);
    }
    setDialogOpen(false);
    setSelectedEvent(null);
    setSelectedTimeSlot(null);
  };

  /**
   * Closes the dialog without taking any action.
   */
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
    setSelectedTimeSlot(null);
  };

  /**
   * Custom renderer for calendar event content.
   * Formats the display of time slots on the calendar.
   * 
   * @param {Object} eventInfo - Event information provided by FullCalendar
   * @returns {React.ReactNode} Custom event content
   */
  const renderEventContent = (eventInfo) => {
    const { slot, attendees, isFull, isRegistered } = eventInfo.event.extendedProps;
    
    return (
      <Box sx={{ 
        padding: '2px 4px', 
        overflow: 'hidden', 
        whiteSpace: 'nowrap', 
        textOverflow: 'ellipsis',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Typography variant="caption" sx={{ 
          fontWeight: 600, 
          display: 'block', 
          fontSize: '0.8rem',
          lineHeight: 1.2
        }}>
          {eventInfo.timeText && `${eventInfo.timeText}`}
        </Typography>
        <Typography variant="caption" sx={{ 
          display: 'block',
          fontWeight: 500,
          fontSize: '0.75rem',
          lineHeight: 1.2
        }}>
          {eventInfo.event.title}
          {isRegistered && ' ✓'}
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <Paper 
        elevation={0}
        sx={{ 
          height: 'calc(100vh - 200px)', 
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
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
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          allDaySlot={false}
          slotDuration="00:30:00"
          dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
          stickyHeaderDates={true}
          nowIndicator={true}
        />
      </Paper>

      {/* Enhanced Event Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 5,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          px: 3, 
          pt: 3, 
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h5" fontWeight={600}>
            {selectedEvent && selectedEvent.title}
          </Typography>
          <IconButton onClick={handleDialogClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3, py: 2 }}>
          {selectedTimeSlot && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={500} color="primary.main">
                  {selectedTimeSlot.start_time && new Date(selectedTimeSlot.start_time).toLocaleString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 0.5 }}>
                  <Chip 
                    label={selectedEvent?.extendedProps?.isFull ? 'FULL' : 'AVAILABLE'} 
                    size="small" 
                    color={selectedEvent?.extendedProps?.isFull ? 'default' : 'success'} 
                    sx={{ mr: 1 }}
                  />
                  {selectedEvent?.extendedProps?.isRegistered && (
                    <Chip 
                      label="REGISTERED" 
                      size="small" 
                      color="secondary"
                    />
                  )}
                </Box>
              </Box>
              
              {selectedTimeSlot.location && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <LocationIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, mt: 0.3 }} />
                  <Typography>{selectedTimeSlot.location}</Typography>
                </Box>
              )}
              
              {selectedTimeSlot.description && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <DescriptionIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, mt: 0.3 }} />
                  <Typography>{selectedTimeSlot.description}</Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GroupIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight={500}>
                    Attendees ({selectedEvent?.extendedProps?.attendees.length || 0}/{selectedTimeSlot.max_attendees})
                  </Typography>
                </Box>
                
                {selectedEvent?.extendedProps?.attendees.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 4 }}>
                    {selectedEvent.extendedProps.attendees.map(attendee => (
                      <Box key={attendee.id} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 28, 
                            height: 28, 
                            bgcolor: 'primary.light',
                            fontSize: '0.875rem',
                            mr: 1
                          }}
                        >
                          {attendee.user?.first_name?.[0] || '?'}
                        </Avatar>
                        <Typography>
                          {attendee.user?.first_name || ''} {attendee.user?.last_name || ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    No attendees yet
                  </Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {dialogAction === 'register' && (
            <Button 
              onClick={handleDialogConfirm} 
              variant="contained" 
              color="primary"
              startIcon={<PersonAddIcon />}
              sx={{ borderRadius: 2, py: 1, px: 2 }}
            >
              Register for This Session
            </Button>
          )}
          
          {dialogAction === 'unregister' && (
            <Button 
              onClick={handleDialogConfirm} 
              variant="outlined" 
              color="error"
              startIcon={<PersonRemoveIcon />}
              sx={{ borderRadius: 2, py: 1, px: 2 }}
            >
              Unregister from This Session
            </Button>
          )}
          
          {dialogAction === 'view' && (
            <Button 
              onClick={handleDialogClose} 
              variant="outlined"
              sx={{ borderRadius: 2, py: 1, px: 2 }}
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionCalendar;