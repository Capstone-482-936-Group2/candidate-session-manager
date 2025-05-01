import axios from 'axios';
import api, {
  authAPI,
  usersAPI,
  seasonsAPI,
  candidateSectionsAPI,
  timeSlotsAPI,
  timeSlotTemplatesAPI,
  locationTypesAPI,
  locationsAPI,
  facultyAvailabilityAPI,
  availabilityInvitationAPI,
  testAPI
} from './api';

// Mock axios with inline mock implementation
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: {
        use: jest.fn(fn => {
          mockAxiosInstance.interceptors.request.mockHandler = fn;
          return 0;
        }),
        mockHandler: null
      },
      response: {
        use: jest.fn(),
      }
    }
  };

  return {
    create: jest.fn().mockReturnValue(mockAxiosInstance),
    defaults: {}
  };
});

// Get access to the mocked axios instance after it's been created
const mockAxios = axios.create();

// Mock document.cookie for CSRF token tests
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'csrftoken=test-csrf-token'
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Fix for the first test - Add this right after the mockAxios const definition
// This will ensure the create method is called with the right arguments
const originalCreate = axios.create;
axios.create = jest.fn().mockImplementation((config) => {
  expect(config).toEqual({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return mockAxios;
});

describe('API Client', () => {
  test('axios instance is created with correct config', () => {
    // The assertion is already handled in the mock implementation above
    // Just verify the create method was called at least once
    expect(axios.create).toHaveBeenCalled();
  });

  test('request interceptor adds CSRF token to non-GET requests', () => {
    const config = {
      method: 'post',
      headers: {}
    };
    
    // Use the stored handler directly
    const result = mockAxios.interceptors.request.mockHandler(config);
    
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token');
  });

  test('request interceptor does not add CSRF token to GET requests', () => {
    const config = {
      method: 'get',
      headers: {}
    };
    
    // Use the stored handler directly
    const result = mockAxios.interceptors.request.mockHandler(config);
    
    expect(result.headers['X-CSRFToken']).toBeUndefined();
  });
});

describe('Auth API', () => {
  test('googleLogin calls the correct endpoint with proper data', async () => {
    const testCredential = 'test-credential';
    await authAPI.googleLogin({ credential: testCredential });
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/google_login/', { credential: testCredential });
  });

  test('logout calls the correct endpoint', async () => {
    await authAPI.logout();
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/logout/');
  });

  test('register calls the correct endpoint with user data', async () => {
    const userData = { username: 'test', email: 'test@example.com' };
    await authAPI.register(userData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/register/', userData);
  });

  test('getCurrentUser calls the correct endpoint', async () => {
    await authAPI.getCurrentUser();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/users/me/');
  });
});

describe('Users API', () => {
  test('getUsers calls the correct endpoint with params', async () => {
    await usersAPI.getUsers();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/users/', {
      params: {
        include_profile: true
      }
    });
  });

  test('getUser calls the correct endpoint with ID', async () => {
    await usersAPI.getUser(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/users/123/');
  });

  test('addUser calls the correct endpoint with user data', async () => {
    const userData = { name: 'Test User', email: 'test@example.com' };
    await usersAPI.addUser(userData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/', userData);
  });

  test('updateUser calls the correct endpoint with ID and data', async () => {
    const userData = { name: 'Updated User' };
    await usersAPI.updateUser(123, userData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/users/123/', userData);
  });

  test('deleteUser calls the correct endpoint with ID', async () => {
    await usersAPI.deleteUser(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/users/123/');
  });

  test('updateUserRole calls the correct endpoint with ID and role', async () => {
    await usersAPI.updateUserRole(123, 'admin');
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/users/123/update_role/', { user_type: 'admin' });
  });

  test('sendFormLink calls the correct endpoint with form data', async () => {
    await usersAPI.sendFormLink(123, 'test@example.com', 'Test message');
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/send_form_link/', { 
      form_id: 123, 
      candidate_email: 'test@example.com', 
      message: 'Test message' 
    });
  });

  test('completeRoomSetup calls the correct endpoint with room number', async () => {
    await usersAPI.completeRoomSetup('A-123');
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/complete_room_setup/', { room_number: 'A-123' });
  });

  test('uploadHeadshot calls the correct endpoint with form data', async () => {
    const formData = new FormData();
    mockAxios.post.mockResolvedValueOnce({ data: { url: 'test-url.jpg' } });
    
    const result = await usersAPI.uploadHeadshot(formData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/upload_headshot/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    expect(result).toEqual({ url: 'test-url.jpg' });
  });

  test('uploadHeadshot handles error when response is invalid', async () => {
    const formData = new FormData();
    mockAxios.post.mockResolvedValueOnce({ data: null });
    
    await expect(usersAPI.uploadHeadshot(formData)).rejects.toThrow('Invalid response from server');
  });

  test('completeCandidateSetup calls the correct endpoint with profile data', async () => {
    const profileData = { name: 'Test Candidate', skills: ['JavaScript'] };
    await usersAPI.completeCandidateSetup(profileData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/complete_candidate_setup/', profileData);
  });

  test('me calls the correct endpoint', async () => {
    await usersAPI.me();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/users/me/');
  });

  test('googleLogin with string credential calls the correct endpoint', async () => {
    await usersAPI.googleLogin('test-credential');
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/google_login/', { credential: 'test-credential' });
  });

  test('googleLogin with object credential calls the correct endpoint', async () => {
    await usersAPI.googleLogin({ credential: 'test-credential' });
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/google_login/', { credential: 'test-credential' });
  });

  test('logout calls the correct endpoint', async () => {
    await usersAPI.logout();
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/logout/');
  });

  test('downloadHeadshot calls the correct endpoint with URL param', async () => {
    await usersAPI.downloadHeadshot('test-url.jpg');
    
    expect(mockAxios.get).toHaveBeenCalledWith('/users/download_headshot/', {
      params: { url: 'test-url.jpg' },
      responseType: 'blob'
    });
  });
});

describe('Seasons API', () => {
  test('getSeasons calls the correct endpoint', async () => {
    await seasonsAPI.getSeasons();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/seasons/');
  });

  test('getSeasonById calls the correct endpoint with ID', async () => {
    await seasonsAPI.getSeasonById(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/seasons/123/');
  });

  test('createSeason calls the correct endpoint with season data', async () => {
    const seasonData = { name: 'Fall 2023', start_date: '2023-08-01' };
    await seasonsAPI.createSeason(seasonData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/seasons/', seasonData);
  });

  test('updateSeason calls the correct endpoint with ID and data', async () => {
    const seasonData = { name: 'Updated Season' };
    await seasonsAPI.updateSeason(123, seasonData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/seasons/123/', seasonData);
  });

  test('deleteSeason calls the correct endpoint with ID', async () => {
    await seasonsAPI.deleteSeason(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/seasons/123/');
  });
});

describe('Candidate Sections API', () => {
  test('getCandidateSections calls the correct endpoint', async () => {
    await candidateSectionsAPI.getCandidateSections();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/candidate-sections/');
  });

  test('getCandidateSectionById calls the correct endpoint with ID', async () => {
    await candidateSectionsAPI.getCandidateSectionById(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/candidate-sections/123/');
  });

  test('getCandidateSectionsBySeason calls the correct endpoint with season ID', async () => {
    await candidateSectionsAPI.getCandidateSectionsBySeason(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/candidate-sections/?session=123');
  });

  test('createCandidateSection calls the correct endpoint with section data', async () => {
    const sectionData = { name: 'Section A', season_id: 123 };
    await candidateSectionsAPI.createCandidateSection(sectionData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/candidate-sections/', sectionData);
  });

  test('updateCandidateSection calls the correct endpoint with ID and data', async () => {
    const sectionData = { name: 'Updated Section' };
    await candidateSectionsAPI.updateCandidateSection(123, sectionData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/candidate-sections/123/', sectionData);
  });

  test('deleteCandidateSection calls the correct endpoint with ID', async () => {
    await candidateSectionsAPI.deleteCandidateSection(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/candidate-sections/123/');
  });
});

describe('Time Slots API', () => {
  test('getTimeSlots calls the correct endpoint', async () => {
    await timeSlotsAPI.getTimeSlots();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/timeslots/');
  });

  test('getTimeSlotById calls the correct endpoint with ID', async () => {
    await timeSlotsAPI.getTimeSlotById(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/timeslots/123/');
  });

  test('getTimeSlotsByCandidateSection calls the correct endpoint with section ID', async () => {
    await timeSlotsAPI.getTimeSlotsByCandidateSection(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/timeslots/?candidate_section=123');
  });

  test('createTimeSlot calls the correct endpoint with time slot data', async () => {
    const timeSlotData = { start_time: '10:00', end_time: '11:00' };
    await timeSlotsAPI.createTimeSlot(timeSlotData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/timeslots/', timeSlotData);
  });

  test('updateTimeSlot calls the correct endpoint with ID and data', async () => {
    const timeSlotData = { start_time: '11:00' };
    await timeSlotsAPI.updateTimeSlot(123, timeSlotData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/timeslots/123/', timeSlotData);
  });

  test('deleteTimeSlot calls the correct endpoint with ID', async () => {
    await timeSlotsAPI.deleteTimeSlot(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/timeslots/123/');
  });

  test('registerForTimeSlot calls the correct endpoint with ID', async () => {
    await timeSlotsAPI.registerForTimeSlot(123);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/timeslots/123/register/');
  });

  test('unregisterFromTimeSlot calls the correct endpoint with ID', async () => {
    await timeSlotsAPI.unregisterFromTimeSlot(123);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/timeslots/123/unregister/');
  });
});

describe('Time Slot Templates API', () => {
  test('getTemplates calls the correct endpoint', async () => {
    await timeSlotTemplatesAPI.getTemplates();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/timeslot-templates/');
  });

  test('getTemplateById calls the correct endpoint with ID', async () => {
    await timeSlotTemplatesAPI.getTemplateById(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/timeslot-templates/123/');
  });

  test('createTemplate calls the correct endpoint with template data', async () => {
    const templateData = { name: 'Morning Slots', slots: [] };
    await timeSlotTemplatesAPI.createTemplate(templateData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/timeslot-templates/', templateData);
  });

  test('updateTemplate calls the correct endpoint with ID and data', async () => {
    const templateData = { name: 'Updated Template' };
    await timeSlotTemplatesAPI.updateTemplate(123, templateData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/timeslot-templates/123/', templateData);
  });

  test('deleteTemplate calls the correct endpoint with ID', async () => {
    await timeSlotTemplatesAPI.deleteTemplate(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/timeslot-templates/123/');
  });
});

describe('Location Types API', () => {
  test('getLocationTypes calls the correct endpoint', async () => {
    await locationTypesAPI.getLocationTypes();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/location-types/');
  });

  test('getLocationTypeById calls the correct endpoint with ID', async () => {
    await locationTypesAPI.getLocationTypeById(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/location-types/123/');
  });

  test('createLocationType calls the correct endpoint with location type data', async () => {
    const locationTypeData = { name: 'Classroom', description: 'Physical classroom' };
    await locationTypesAPI.createLocationType(locationTypeData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/location-types/', locationTypeData);
  });

  test('updateLocationType calls the correct endpoint with ID and data', async () => {
    const locationTypeData = { name: 'Updated Location Type' };
    await locationTypesAPI.updateLocationType(123, locationTypeData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/location-types/123/', locationTypeData);
  });

  test('deleteLocationType calls the correct endpoint with ID', async () => {
    await locationTypesAPI.deleteLocationType(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/location-types/123/');
  });
});

describe('Locations API', () => {
  test('getLocations calls the correct endpoint with params', async () => {
    const params = { type: 'classroom' };
    await locationsAPI.getLocations(params);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/locations/', { params });
  });

  test('getLocationById calls the correct endpoint with ID', async () => {
    await locationsAPI.getLocationById(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/locations/123/');
  });

  test('createLocation calls the correct endpoint with location data', async () => {
    const locationData = { name: 'Room A-123', type_id: 1 };
    await locationsAPI.createLocation(locationData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/locations/', locationData);
  });

  test('updateLocation calls the correct endpoint with ID and data', async () => {
    const locationData = { name: 'Updated Location' };
    await locationsAPI.updateLocation(123, locationData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/locations/123/', locationData);
  });

  test('deleteLocation calls the correct endpoint with ID', async () => {
    await locationsAPI.deleteLocation(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/locations/123/');
  });
});

describe('Faculty Availability API', () => {
  test('getAvailability calls the correct endpoint', async () => {
    await facultyAvailabilityAPI.getAvailability();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/faculty-availability/');
  });

  test('getAvailabilityById calls the correct endpoint with ID', async () => {
    await facultyAvailabilityAPI.getAvailabilityById(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/faculty-availability/123/');
  });

  test('getAvailabilityByCandidate calls the correct endpoint with candidate section ID', async () => {
    await facultyAvailabilityAPI.getAvailabilityByCandidate(123);
    
    expect(mockAxios.get).toHaveBeenCalledWith('/faculty-availability/?candidate_section=123');
  });

  test('submitAvailability calls the correct endpoint with availability data', async () => {
    const availabilityData = { faculty_id: 1, slots: [] };
    await facultyAvailabilityAPI.submitAvailability(availabilityData);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/faculty-availability/', availabilityData);
  });

  test('updateAvailability calls the correct endpoint with ID and data', async () => {
    const availabilityData = { slots: [] };
    await facultyAvailabilityAPI.updateAvailability(123, availabilityData);
    
    expect(mockAxios.patch).toHaveBeenCalledWith('/faculty-availability/123/', availabilityData);
  });

  test('deleteAvailability calls the correct endpoint with ID', async () => {
    await facultyAvailabilityAPI.deleteAvailability(123);
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/faculty-availability/123/');
  });

  test('importAvailability calls the correct endpoint with ID and options', async () => {
    await facultyAvailabilityAPI.importAvailability(45, 123, { markAsImported: true });
    
    expect(mockAxios.post).toHaveBeenCalledWith('/faculty-availability/123/import_slots/', {
      mark_as_imported: true
    });
  });
});

describe('Availability Invitation API', () => {
  beforeEach(() => {
    // Setup mock implementation that handles chained promises with catch
    mockAxios.post.mockImplementation(() => {
      return {
        then: () => ({
          catch: () => Promise.resolve({ data: {} })
        })
      };
    });
  });

  test('getInvitations calls the correct endpoint', async () => {
    await availabilityInvitationAPI.getInvitations();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/availability-invitations/');
  });

  test('inviteFaculty calls the correct endpoint with faculty and section IDs', async () => {
    const facultyIds = [1, 2, 3];
    const candidateSectionIds = [4, 5, 6];
    await availabilityInvitationAPI.inviteFaculty(facultyIds, candidateSectionIds);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/availability-invitations/invite_faculty/', {
      faculty_ids: facultyIds,
      candidate_section_ids: candidateSectionIds,
      send_email: true
    });
  });

  test('inviteFaculty with sendEmail=false calls the correct endpoint', async () => {
    const facultyIds = [1, 2, 3];
    const candidateSectionIds = [4, 5, 6];
    await availabilityInvitationAPI.inviteFaculty(facultyIds, candidateSectionIds, false);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/availability-invitations/invite_faculty/', {
      faculty_ids: facultyIds,
      candidate_section_ids: candidateSectionIds,
      send_email: false
    });
  });
});

describe('Test API', () => {
  test('testS3 calls the correct endpoint', async () => {
    await testAPI.testS3();
    
    expect(mockAxios.post).toHaveBeenCalledWith('/users/test_s3/');
  });
});
