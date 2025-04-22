import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with credentials support
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add this function after creating the api instance
api.interceptors.request.use(config => {
  // Get CSRF token from cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
    
  if (csrfToken && config.method !== 'get') {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  return config;
});

// Authentication API
export const authAPI = {
  googleLogin: async (data) => {
    return await api.post('/users/google_login/', data);
  },
  logout: () => api.post('/users/logout/'),
  register: (userData) => api.post('/users/register/', userData),
  getCurrentUser: () => api.get('/users/me/'),
};

// User Management API
export const usersAPI = {
  getUsers: () => api.get('/users/', {
    params: {
      include_profile: true  // Add this parameter to get candidate profiles
    }
  }),
  getUser: (id) => api.get(`/users/${id}/`),
  addUser: (userData) => api.post('/users/', userData),
  updateUser: (id, userData) => api.patch(`/users/${id}/`, userData),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  updateUserRole: (id, role) => api.patch(`/users/${id}/update_role/`, { user_type: role }),
  sendFormLink: (formId, candidateEmail, message) => api.post('/users/send_form_link/', { 
    form_id: formId, 
    candidate_email: candidateEmail, 
    message: message 
  }),
  completeRoomSetup: (roomNumber) => api.post('/users/complete_room_setup/', { room_number: roomNumber }),
  uploadHeadshot: async (formData) => {
    try {
      const response = await api.post('/users/upload_headshot/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data || !response.data.url) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Upload error details:', error.response?.data || error.message);
      throw error;
    }
  },
  completeCandidateSetup: async (profileData) => {
    try {
      const response = await api.post('/users/complete_candidate_setup/', profileData);
      console.log('API response:', response);
      return response;
    } catch (error) {
      console.error('Error completing candidate setup:', error);
      throw error;
    }
  },
  me: async () => {
    return await api.get('/users/me/');
  },
  googleLogin: async (credential) => {
    console.log("API googleLogin called with:", credential);
    
    // Format the data properly - the backend expects 'credential', not 'access_token'
    const data = {
      credential: typeof credential === 'string' 
        ? credential 
        : credential.credential
    };
    
    try {
      return await api.post('/users/google_login/', data);
    } catch (error) {
      console.error("Google login error details:", error.response?.data);
      throw error;
    }
  },
  logout: async () => {
    return await api.post('/users/logout/');
  },
  downloadHeadshot: (url) => api.get('/users/download_headshot/', {
    params: { url },
    responseType: 'blob'
  }),
};

// Recruiting Seasons API (formerly Sessions API)
export const seasonsAPI = {
  getSeasons: () => api.get('/seasons/'),
  getSeasonById: (id) => api.get(`/seasons/${id}/`),
  createSeason: (seasonData) => api.post('/seasons/', seasonData),
  updateSeason: (id, seasonData) => api.patch(`/seasons/${id}/`, seasonData),
  deleteSeason: (id) => api.delete(`/seasons/${id}/`),
};

// Candidate Sections API 
export const candidateSectionsAPI = {
  getCandidateSections: () => api.get('/candidate-sections/'),
  getCandidateSectionById: (id) => api.get(`/candidate-sections/${id}/`),
  getCandidateSectionsBySeason: (seasonId) => api.get(`/candidate-sections/?session=${seasonId}`),
  createCandidateSection: (sectionData) => api.post('/candidate-sections/', sectionData),
  updateCandidateSection: (id, sectionData) => api.patch(`/candidate-sections/${id}/`, sectionData),
  deleteCandidateSection: (id) => api.delete(`/candidate-sections/${id}/`),
};

// Time Slots API
export const timeSlotsAPI = {
  getTimeSlots: () => api.get('/timeslots/'),
  getTimeSlotById: (id) => api.get(`/timeslots/${id}/`),
  getTimeSlotsByCandidateSection: (sectionId) => api.get(`/timeslots/?candidate_section=${sectionId}`),
  createTimeSlot: async (timeSlotData) => {
    try {
      const response = await api.post('/timeslots/', timeSlotData);
      return response;
    } catch (error) {
      console.error('API Error creating time slot:', error);
      throw error;
    }
  },
  updateTimeSlot: (id, timeSlotData) => api.patch(`/timeslots/${id}/`, timeSlotData),
  deleteTimeSlot: (id) => api.delete(`/timeslots/${id}/`),
  registerForTimeSlot: (id) => api.post(`/timeslots/${id}/register/`),
  unregisterFromTimeSlot: (id) => api.post(`/timeslots/${id}/unregister/`),
};

// Time Slot Templates API
export const timeSlotTemplatesAPI = {
  getTemplates: () => api.get('/timeslot-templates/'),
  getTemplateById: (id) => api.get(`/timeslot-templates/${id}/`),
  createTemplate: (templateData) => api.post('/timeslot-templates/', templateData),
  updateTemplate: (id, templateData) => api.patch(`/timeslot-templates/${id}/`, templateData),
  deleteTemplate: (id) => api.delete(`/timeslot-templates/${id}/`)
};

// Location Types API
export const locationTypesAPI = {
  getLocationTypes: () => api.get('/location-types/'),
  getLocationTypeById: (id) => api.get(`/location-types/${id}/`),
  createLocationType: (locationTypeData) => api.post('/location-types/', locationTypeData),
  updateLocationType: (id, locationTypeData) => api.patch(`/location-types/${id}/`, locationTypeData),
  deleteLocationType: (id) => api.delete(`/location-types/${id}/`)
};

// Locations API
export const locationsAPI = {
  getLocations: (params) => api.get('/locations/', { params }),
  getLocationById: (id) => api.get(`/locations/${id}/`),
  createLocation: (locationData) => api.post('/locations/', locationData),
  updateLocation: (id, locationData) => api.patch(`/locations/${id}/`, locationData),
  deleteLocation: (id) => api.delete(`/locations/${id}/`)
};

export const facultyAvailabilityAPI = {
  getAvailability: () => api.get('/faculty-availability/'),
  getAvailabilityById: (id) => api.get(`/faculty-availability/${id}/`),
  getAvailabilityByCandidate: (candidateSectionId) => api.get(`/faculty-availability/?candidate_section=${candidateSectionId}`),
  submitAvailability: (availabilityData) => api.post('/faculty-availability/', availabilityData),
  updateAvailability: (id, availabilityData) => api.patch(`/faculty-availability/${id}/`, availabilityData),
  deleteAvailability: (id) => api.delete(`/faculty-availability/${id}/`),
  importAvailability: (candidateSectionId, availabilityId, options = {}) => {
    console.log("Importing availability with ID:", availabilityId, "for section:", candidateSectionId);
    return api.post(`/faculty-availability/${availabilityId}/import_slots/`, {
      mark_as_imported: options.markAsImported || true
    });
  },
};

export const availabilityInvitationAPI = {
  getInvitations: () => api.get('/availability-invitations/'),
  inviteFaculty: (facultyIds, candidateSectionIds, sendEmail = true) => {
    console.log("API inviteFaculty called with:", { facultyIds, candidateSectionIds, sendEmail });
    return api.post('/availability-invitations/invite_faculty/', {
      faculty_ids: facultyIds,
      candidate_section_ids: candidateSectionIds,
      send_email: sendEmail
    })
    .catch(error => {
      console.error("API Error in inviteFaculty:", error.response || error);
      throw error;
    });
  },
};

export const testAPI = {
  testS3: () => api.post('/users/test_s3/'),
};

export default api;
