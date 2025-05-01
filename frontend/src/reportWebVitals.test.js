// Mock web-vitals at the top level, outside of any describe or test blocks
const mockWebVitals = {
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
};

// Mock the dynamic import to return our mock functions
jest.mock('web-vitals', () => ({
  __esModule: true,
  getCLS: (...args) => mockWebVitals.getCLS(...args),
  getFID: (...args) => mockWebVitals.getFID(...args),
  getFCP: (...args) => mockWebVitals.getFCP(...args),
  getLCP: (...args) => mockWebVitals.getLCP(...args),
  getTTFB: (...args) => mockWebVitals.getTTFB(...args),
}));

// Now import the module under test
import reportWebVitals from './reportWebVitals';

describe('reportWebVitals', () => {
  let mockPerfEntry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerfEntry = jest.fn();
  });

  it('calls web-vitals functions when valid callback is provided', async () => {
    reportWebVitals(mockPerfEntry);
    
    // Need to wait for multiple ticks to ensure all promises resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    await Promise.resolve();

    expect(mockWebVitals.getCLS).toHaveBeenCalledWith(mockPerfEntry);
    expect(mockWebVitals.getFID).toHaveBeenCalledWith(mockPerfEntry);
    expect(mockWebVitals.getFCP).toHaveBeenCalledWith(mockPerfEntry);
    expect(mockWebVitals.getLCP).toHaveBeenCalledWith(mockPerfEntry);
    expect(mockWebVitals.getTTFB).toHaveBeenCalledWith(mockPerfEntry);
  });

  it('does not call web-vitals functions when callback is null', async () => {
    reportWebVitals(null);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWebVitals.getCLS).not.toHaveBeenCalled();
    expect(mockWebVitals.getFID).not.toHaveBeenCalled();
    expect(mockWebVitals.getFCP).not.toHaveBeenCalled();
    expect(mockWebVitals.getLCP).not.toHaveBeenCalled();
    expect(mockWebVitals.getTTFB).not.toHaveBeenCalled();
  });

  it('does not call web-vitals functions when callback is not a function', async () => {
    reportWebVitals('not a function');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWebVitals.getCLS).not.toHaveBeenCalled();
    expect(mockWebVitals.getFID).not.toHaveBeenCalled();
    expect(mockWebVitals.getFCP).not.toHaveBeenCalled();
    expect(mockWebVitals.getLCP).not.toHaveBeenCalled();
    expect(mockWebVitals.getTTFB).not.toHaveBeenCalled();
  });

  it('handles the case when web-vitals module fails to load', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Re-mock the module to simulate a failure
    jest.resetModules();
    jest.doMock('web-vitals', () => {
      throw new Error('Failed to load web-vitals');
    });

    // Need to re-import after resetting modules
    const { default: reportWebVitalsRetry } = await import('./reportWebVitals');
    reportWebVitalsRetry(mockPerfEntry);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockPerfEntry).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
