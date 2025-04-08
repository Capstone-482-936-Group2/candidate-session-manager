import { gapi } from 'gapi-script';
import { format } from 'date-fns';

// Google API credentials - you'll need to get these from Google Developer Console
const API_KEY = 'YOUR_API_KEY';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const DISCOVERY_DOCS = ['https://docs.googleapis.com/$discovery/rest?version=v1'];
const SCOPES = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file';

// Initialize the Google API client
export const initGoogleApi = () => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(() => {
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
          gapi.auth2.getAuthInstance().signIn().then(resolve).catch(reject);
        } else {
          resolve();
        }
      }).catch(reject);
    });
  });
};

// Create a new Google Doc with the candidate's itinerary
export const createItineraryDoc = async (candidateSection, season) => {
  try {
    // Make sure the user is authenticated
    await initGoogleApi();
    
    // Create a new document
    const document = await gapi.client.docs.documents.create({
      title: `Itinerary for ${candidateSection.candidate.first_name} ${candidateSection.candidate.last_name} - ${season.title}`
    });
    
    const documentId = document.result.documentId;
    
    // Format the content for the document
    const content = formatItineraryContent(candidateSection, season);
    
    // Insert content into the document
    await gapi.client.docs.documents.batchUpdate({
      documentId: documentId,
      resource: {
        requests: content
      }
    });
    
    // Make the document publicly accessible with a link
    await gapi.client.drive.permissions.create({
      fileId: documentId,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    // Return the URL to the document
    return `https://docs.google.com/document/d/${documentId}/edit`;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Format time slots into requests for the Google Docs API
const formatItineraryContent = (section, season) => {
  const requests = [];
  
  // Add title
  requests.push({
    insertText: {
      location: {
        index: 1
      },
      text: `Itinerary for ${section.candidate.first_name} ${section.candidate.last_name}\n\n`
    }
  });
  
  // Add session details
  requests.push({
    insertText: {
      location: {
        index: requests[requests.length - 1].insertText.text.length + 1
      },
      text: `${season.title}\n${format(new Date(season.start_date), 'MMMM d, yyyy')} - ${format(new Date(season.end_date), 'MMMM d, yyyy')}\n\n`
    }
  });
  
  // Add candidate details
  if (section.arrival_date || section.leaving_date || section.needs_transportation) {
    requests.push({
      insertText: {
        location: {
          index: getLastIndex(requests)
        },
        text: "Travel Information:\n"
      }
    });
    
    if (section.arrival_date) {
      requests.push({
        insertText: {
          location: {
            index: getLastIndex(requests)
          },
          text: `Arrival: ${format(new Date(section.arrival_date), 'MMMM d, yyyy')}\n`
        }
      });
    }
    
    if (section.leaving_date) {
      requests.push({
        insertText: {
          location: {
            index: getLastIndex(requests)
          },
          text: `Departure: ${format(new Date(section.leaving_date), 'MMMM d, yyyy')}\n`
        }
      });
    }
    
    if (section.needs_transportation) {
      requests.push({
        insertText: {
          location: {
            index: getLastIndex(requests)
          },
          text: "Transportation will be provided\n"
        }
      });
    }
    
    requests.push({
      insertText: {
        location: {
          index: getLastIndex(requests)
        },
        text: "\n"
      }
    });
  }
  
  // Add schedule heading
  requests.push({
    insertText: {
      location: {
        index: getLastIndex(requests)
      },
      text: "Schedule:\n\n"
    }
  });
  
  // Sort time slots by start time
  const sortedTimeSlots = [...section.time_slots].sort((a, b) => 
    new Date(a.start_time) - new Date(b.start_time)
  );
  
  // Add time slots
  sortedTimeSlots.forEach(slot => {
    const timeText = slot.end_time 
      ? `${format(new Date(slot.start_time), 'MMMM d, yyyy h:mm a')} - ${format(new Date(slot.end_time), 'h:mm a')}`
      : `${format(new Date(slot.start_time), 'MMMM d, yyyy h:mm a')} (No end time)`;
    
    requests.push({
      insertText: {
        location: {
          index: getLastIndex(requests)
        },
        text: `• ${timeText}\n`
      }
    });
    
    if (slot.location) {
      requests.push({
        insertText: {
          location: {
            index: getLastIndex(requests)
          },
          text: `  Location: ${slot.location}\n`
        }
      });
    }
    
    if (slot.description) {
      requests.push({
        insertText: {
          location: {
            index: getLastIndex(requests)
          },
          text: `  ${slot.description}\n`
        }
      });
    }
    
    requests.push({
      insertText: {
        location: {
          index: getLastIndex(requests)
        },
        text: "\n"
      }
    });
  });
  
  // Helper function to calculate the last index
  function getLastIndex(requests) {
    let index = 1;
    for (const request of requests) {
      if (request.insertText) {
        index += request.insertText.text.length;
      }
    }
    return index;
  }
  
  return requests;
}; 