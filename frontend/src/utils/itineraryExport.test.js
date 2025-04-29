// itineraryExport.test.js
import { exportCandidateItinerary } from './itineraryExport';

// Mocks
const mockSection = {
  candidate: { first_name: 'John', last_name: 'Doe' },
  arrival_date: '2025-05-01T00:00:00Z',
  leaving_date: '2025-05-05T00:00:00Z',
  needs_transportation: true,
  time_slots: [
    {
      start_time: '2025-05-02T09:00:00Z',
      end_time: '2025-05-02T10:00:00Z',
      location: 'Main Hall',
      description: 'Orientation Meeting'
    },
    {
      start_time: '2025-05-03T13:00:00Z',
      end_time: '2025-05-03T14:30:00Z',
      location: 'Library',
      description: 'Campus Tour'
    }
  ]
};

const mockSeason = {
  title: 'Spring 2025 Recruitment',
  start_date: '2025-05-01T00:00:00Z',
  end_date: '2025-05-05T00:00:00Z'
};

describe('exportCandidateItinerary', () => {
  beforeEach(() => {
    // Mock createElement, appendChild, removeChild, and click
    document.createElement = jest.fn(() => ({
      click: jest.fn(),
      set href(val) { this._href = val; },
      set download(val) { this._download = val; }
    }));
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test');
    URL.revokeObjectURL = jest.fn();
  });

  it('generates and triggers download of the HTML file', () => {
    const url = exportCandidateItinerary(mockSection, mockSeason);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();

    // Verify the returned URL
    expect(url).toBe('blob:http://localhost/test');
  });

  it('sets correct file name for download', () => {
    const a = { click: jest.fn() };
    document.createElement = jest.fn(() => a);

    exportCandidateItinerary(mockSection, mockSeason);

    expect(a.download).toBe('Itinerary_Doe.html');
  });

  it('includes candidate name and season title in the generated HTML blob', () => {
    let capturedHtml = '';
    const originalBlob = global.Blob;
  
    try {
      global.Blob = class extends originalBlob {
        constructor(parts, options) {
          super(parts, options);
          capturedHtml = parts.join('');
        }
      };
  
      exportCandidateItinerary(mockSection, mockSeason);
    } finally {
      global.Blob = originalBlob; // Always restore
    }
  
    expect(capturedHtml).toContain('Itinerary for John Doe');
    expect(capturedHtml).toContain('Spring 2025 Recruitment');
  });
  
});
