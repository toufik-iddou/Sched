import axios from 'axios';
import api, { logout } from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('API Service Auto-Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.removeItem.mockClear();
    mockLocation.href = '';
  });

  it('should auto-logout on 401 response', async () => {
    // Mock a 401 response
    const mockError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            // Simulate the interceptor being called with a 401 error
            onRejected(mockError);
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    } as any);

    // Create the API instance
    const apiInstance = mockedAxios.create();

    // Simulate the response interceptor logic
    const interceptorFunction = apiInstance.interceptors.response.use.mock.calls[0][1];
    
    try {
      await interceptorFunction(mockError);
    } catch (error) {
      // Expected to throw the error after logout
    }

    // Verify that localStorage.removeItem was called
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    
    // Verify that window.location.href was set to login
    expect(mockLocation.href).toBe('/login');
  });

  it('should auto-logout on 403 response (non-CSRF)', async () => {
    // Mock a 403 response that's not CSRF-related
    const mockError = {
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            // Simulate the interceptor being called with a 403 error
            onRejected(mockError);
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    } as any);

    // Create the API instance
    const apiInstance = mockedAxios.create();

    // Simulate the response interceptor logic
    const interceptorFunction = apiInstance.interceptors.response.use.mock.calls[0][1];
    
    try {
      await interceptorFunction(mockError);
    } catch (error) {
      // Expected to throw the error after logout
    }

    // Verify that localStorage.removeItem was called
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    
    // Verify that window.location.href was set to login
    expect(mockLocation.href).toBe('/login');
  });

  it('should handle CSRF token validation failure without logout', async () => {
    // Mock a 403 response specifically for CSRF token validation failure
    const mockError = {
      response: {
        status: 403,
        data: { error: 'CSRF token validation failed' },
      },
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            // Simulate the interceptor being called with a CSRF error
            onRejected(mockError);
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    } as any);

    // Create the API instance
    const apiInstance = mockedAxios.create();

    // Simulate the response interceptor logic
    const interceptorFunction = apiInstance.interceptors.response.use.mock.calls[0][1];
    
    try {
      await interceptorFunction(mockError);
    } catch (error) {
      // Expected to throw the error
    }

    // Verify that localStorage.removeItem was NOT called for CSRF errors
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    
    // Verify that window.location.href was NOT changed
    expect(mockLocation.href).toBe('');
  });

  it('should not logout on other error codes', async () => {
    // Mock a 500 response
    const mockError = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            // Simulate the interceptor being called with a 500 error
            onRejected(mockError);
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    } as any);

    // Create the API instance
    const apiInstance = mockedAxios.create();

    // Simulate the response interceptor logic
    const interceptorFunction = apiInstance.interceptors.response.use.mock.calls[0][1];
    
    try {
      await interceptorFunction(mockError);
    } catch (error) {
      // Expected to throw the error
    }

    // Verify that localStorage.removeItem was NOT called
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    
    // Verify that window.location.href was NOT changed
    expect(mockLocation.href).toBe('');
  });

  it('should not logout on network errors (no response)', async () => {
    // Mock a network error where error.response is undefined
    const mockError = {
      request: {},
      message: 'Network Error',
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            // Simulate the interceptor being called with a network error
            onRejected(mockError);
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    } as any);

    // Create the API instance
    const apiInstance = mockedAxios.create();

    // Simulate the response interceptor logic
    const interceptorFunction = apiInstance.interceptors.response.use.mock.calls[0][1];
    
    try {
      await interceptorFunction(mockError);
    } catch (error) {
      // Expected to throw the error
    }

    // Verify that localStorage.removeItem was NOT called for network errors
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    
    // Verify that window.location.href was NOT changed
    expect(mockLocation.href).toBe('');
  });
});
