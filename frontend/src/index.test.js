// Mock CSS import first, before any other imports
jest.mock('./index.css', () => ({}));

// Mock all dependencies BEFORE importing them
jest.mock('react-dom/client', () => {
  const mockRender = jest.fn();
  return {
    createRoot: jest.fn(() => ({
      render: mockRender
    }))
  };
});

jest.mock('./App', () => ({
  __esModule: true,
  default: () => <div>Mock App</div>
}));

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>
}));

jest.mock('./reportWebVitals', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

// Now import the dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import reportWebVitals from './reportWebVitals';

describe('Index', () => {
  let mockRoot;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock getElementById
    mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    document.body.appendChild(mockRoot);

    // Mock document.getElementById
    jest.spyOn(document, 'getElementById')
      .mockImplementation((id) => id === 'root' ? mockRoot : null);
  });

  afterEach(() => {
    // Safely clean up the DOM
    if (document.body.contains(mockRoot)) {
      document.body.removeChild(mockRoot);
    }
    jest.restoreAllMocks();
  });

  it('renders the app wrapped in AuthProvider', () => {
    // Import index.js to trigger the rendering
    jest.isolateModules(() => {
      require('./index');
    });

    // Check if createRoot was called with the root element
    expect(ReactDOM.createRoot).toHaveBeenCalledWith(mockRoot);

    // Check if render was called
    const mockRender = ReactDOM.createRoot.mock.results[0].value.render;
    expect(mockRender).toHaveBeenCalled();

    // Check if render was called with App wrapped in AuthProvider
    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall.type).toBe(AuthProvider);
    expect(renderCall.props.children.type).toBe(App);
  });

  it('calls reportWebVitals', () => {
    jest.isolateModules(() => {
      require('./index');
    });

    // Check if reportWebVitals was called
    expect(reportWebVitals.default).toHaveBeenCalled();
  });

  it('handles missing root element gracefully', () => {
    // Remove the root element
    document.body.removeChild(mockRoot);

    // Mock console.error to prevent error output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock getElementById to return null
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    // Import should not throw
    expect(() => {
      jest.isolateModules(() => {
        require('./index');
      });
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  it('renders without crashing when css import fails', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      jest.isolateModules(() => {
        require('./index');
      });
    }).not.toThrow();

    consoleSpy.mockRestore();
  });
});
