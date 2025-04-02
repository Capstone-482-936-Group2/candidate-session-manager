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
  googleLogin: (idToken) => api.post('/users/google_login/', { access_token: idToken }),
  logout: () => api.post('/users/logout/'),
  register: (userData) => api.post('/users/register/', userData),
  getCurrentUser: () => api.get('/users/me/'),
};

// Users API
export const usersAPI = {
  getUsers: () => api.get('/users/'),
  getUserById: (id) => api.get(`/users/${id}/`),
  updateUser: (id, userData) => api.patch(`/users/${id}/`, userData),
  updateUserRole: (id, role) => api.patch(`/users/${id}/update_role/`, { user_type: role }),
  deleteUser: (id) => api.delete(`/users/${id}/`),
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

export default api;
