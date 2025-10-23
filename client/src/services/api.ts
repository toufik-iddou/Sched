import axios from 'axios';
import { API_URL } from '../config.ts';


// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: This allows cookies to be sent with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token management
let csrfToken: string | null = null;

// Function to get CSRF token
export const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }
  
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken!;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw error;
  }
};

// Request interceptor to add CSRF token to all requests
api.interceptors.request.use(async (config) => {
  // Skip CSRF token for GET requests and auth endpoints
  if (config.method === 'get' || config.url?.startsWith('/auth/')) {
    return config;
  }
  
  try {
    const token = await getCsrfToken();
    config.headers['X-CSRF-Token'] = token;
  } catch (error) {
    console.error('Failed to add CSRF token:', error);
  }
  
  return config;
});

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('API Error:', error);
    
    // Check if we have a response object (server responded)
    if (error.response) {
      console.log('Response status:', error.response.status);
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('Authentication error detected');
        
        // Handle CSRF token validation failures specifically
        if (error.response.status === 403 && error.response.data?.error === 'CSRF token validation failed') {
          // Clear CSRF token and retry
          csrfToken = null;
          try {
            const token = await getCsrfToken();
            error.config.headers['X-CSRF-Token'] = token;
            return api.request(error.config);
          } catch (retryError) {
            console.error('Failed to retry with new CSRF token:', retryError);
          }
        } else {
          // For all other 401/403 errors, auto logout
          // Clear any stored authentication state
          localStorage.removeItem('token');
          // Clear CSRF token
          csrfToken = null;
          // Redirect to login
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received (network error, timeout, etc.)
      console.log('Network error - no response received:', error.request);
      console.log('Error message:', error.message);
      
      // For network errors, you might want to show a user-friendly message
      // but don't auto-logout as it might be a temporary network issue
    } else {
      // Something else happened in setting up the request
      console.log('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Authentication functions
export const checkAuthStatus = async () => {
  try {
    const response = await api.get('/auth/status');
    return response.data;
  } catch (error) {
    return { authenticated: false };
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if logout fails
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

// User functions
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.get('/user/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserBookings = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.get('/user/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Availability functions
export const getAvailability = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.get('/availability', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getGroupedAvailability = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.get('/availability/grouped', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createAvailability = async (slot: any) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.post('/availability', slot, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createBulkAvailability = async (bulkData: any) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.post('/availability/bulk', bulkData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteAvailability = async (day: string) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.delete(`/availability/${day}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteSlotType = async (slotType: string) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await api.delete(`/availability/type/${encodeURIComponent(slotType)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Booking functions
export const getHostAvailability = async (username: string) => {
  const response = await api.get(`/booking/availability/${username}`);
  return response.data;
};

export const getHostSlotTypes = async (username: string) => {
  const response = await api.get(`/booking/slot-types/${username}`);
  return response.data;
};

export const createBooking = async (username: string, bookingData: any) => {
  const response = await api.post(`/booking/book/${username}`, bookingData);
  return response.data;
};

export default api;
