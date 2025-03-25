import { format } from 'date-fns';

// Export candidate itinerary (fallback method using downloadable HTML file)
export const exportCandidateItinerary = (section, season) => {
  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Itinerary for ${section.candidate.first_name} ${section.candidate.last_name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #1976d2; }
        .schedule-item { margin-bottom: 15px; }
        .location { font-weight: bold; }
        .description { font-style: italic; }
      </style>
    </head>
    <body>
      <h1>Itinerary for ${section.candidate.first_name} ${section.candidate.last_name}</h1>
      <h2>${season.title}</h2>
      <p>${format(new Date(season.start_date), 'MMMM d, yyyy')} - ${format(new Date(season.end_date), 'MMMM d, yyyy')}</p>
      
      ${renderTravelInfo(section)}
      
      <h2>Schedule:</h2>
      ${renderSchedule(section.time_slots)}
    </body>
    </html>
  `;
  
  // Create a blob and download link
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `Itinerary_${section.candidate.last_name}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up
  URL.revokeObjectURL(url);
  
  // Return the URL for preview (could open in new tab)
  return url;
};

// Helper function to render travel information
const renderTravelInfo = (section) => {
  if (!section.arrival_date && !section.leaving_date && !section.needs_transportation) {
    return '';
  }
  
  let html = '<h2>Travel Information:</h2><ul>';
  
  if (section.arrival_date) {
    html += `<li>Arrival: ${format(new Date(section.arrival_date), 'MMMM d, yyyy')}</li>`;
  }
  
  if (section.leaving_date) {
    html += `<li>Departure: ${format(new Date(section.leaving_date), 'MMMM d, yyyy')}</li>`;
  }
  
  if (section.needs_transportation) {
    html += '<li>Transportation will be provided</li>';
  }
  
  html += '</ul>';
  return html;
};

// Helper function to render the schedule
const renderSchedule = (timeSlots) => {
  if (!timeSlots || timeSlots.length === 0) {
    return '<p>No events scheduled yet.</p>';
  }
  
  // Sort time slots by start time
  const sortedTimeSlots = [...timeSlots].sort((a, b) => 
    new Date(a.start_time) - new Date(b.start_time)
  );
  
  let html = '<div class="schedule">';
  
  sortedTimeSlots.forEach(slot => {
    const timeText = slot.end_time 
      ? `${format(new Date(slot.start_time), 'MMMM d, yyyy h:mm a')} - ${format(new Date(slot.end_time), 'h:mm a')}`
      : `${format(new Date(slot.start_time), 'MMMM d, yyyy h:mm a')} (No end time)`;
    
    html += `
      <div class="schedule-item">
        <div class="time">${timeText}</div>
        ${slot.location ? `<div class="location">Location: ${slot.location}</div>` : ''}
        ${slot.description ? `<div class="description">${slot.description}</div>` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}; 