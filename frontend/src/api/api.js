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
  login: (email, password) => api.post('/users/login/', { email, password }),
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
  createTimeSlot: (timeSlotData) => api.post('/timeslots/', timeSlotData),
  updateTimeSlot: (id, timeSlotData) => api.patch(`/timeslots/${id}/`, timeSlotData),
  deleteTimeSlot: (id) => api.delete(`/timeslots/${id}/`),
  registerForTimeSlot: (id) => api.post(`/timeslots/${id}/register/`),
  unregisterFromTimeSlot: (id) => api.post(`/timeslots/${id}/unregister/`),
};

export default api;
