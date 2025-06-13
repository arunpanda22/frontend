import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import axiosRetry from 'axios-retry';
import { auth } from '@/lib/firebase';
import { handleAuthError } from '@/lib/utils/error-handler';

// Environment-aware base URL determination
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isDevelopment ? "http://localhost:8000" : "https://django-backend-epcse2awb3cyh5e8.centralindia-01.azurewebsites.net");

// Log API URL for debugging
console.log(`API base URL: ${API_BASE_URL} (${isDevelopment ? 'development' : 'production'})`);

// Default timeout increased for long operations
export const DEFAULT_TIMEOUT = 300000; // 5 minutes
export const LONG_OPERATION_TIMEOUT = 300000; // 5 minutes

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Add retry logic
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ? error.response.status >= 500 : false);
  }
});

// Authentication interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const currentUser = auth?.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await handleAuthError(error);
    }
    return Promise.reject(error);
  }
);

// Debug interceptor for development
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(request => {
    console.log('Starting Request:', {
      method: request.method,
      url: request.url,
      baseURL: request.baseURL,
      headers: request.headers
    });
    return request;
  });

  apiClient.interceptors.response.use(response => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  }, error => {
    console.error('Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    return Promise.reject(error);
  });
}

// CSRF token management
let csrfToken: string | null = null;

const getCsrfToken = async (): Promise<string> => {
  try {
    // If we already have a token, use it
    if (csrfToken) {
      return csrfToken;
    }

    // First try to get the CSRF token from the cookie
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
    if (csrfCookie) {
      const token = csrfCookie.split('=')[1];
      if (token) {
        csrfToken = token;
        return token;
      }
    }

    // If no cookie, fetch it from the server
    console.log('No CSRF token in cookie, fetching from server...');
    const response = await axios.get(`${API_BASE_URL}/api/v1/get-csrf-token/`, {
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // If the server sends the token directly in the response
    if (response.data && response.data.csrfToken) {
      const token = response.data.csrfToken;
      if (token) {
        csrfToken = token;
        return token;
      }
    }

    // Check response and cookies again
    const newCookies = document.cookie.split(';');
    const newCsrfCookie = newCookies.find(cookie => cookie.trim().startsWith('csrftoken='));
    if (newCsrfCookie) {
      const token = newCsrfCookie.split('=')[1];
      if (token) {
        csrfToken = token;
        return token;
      }
    }

    throw new Error('Failed to get CSRF token from cookie after fetch');
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
};

// Request interceptor to add CSRF token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.method !== 'get' && config.method !== 'GET') {
      try {
        const token = await getCsrfToken();
        if (!config.headers) {
          config.headers = new axios.AxiosHeaders();
        }
        config.headers['X-CSRFToken'] = token;
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        console.log('Added CSRF token to request:', token);
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        // Don't throw error here, let the request proceed
        // The backend will handle the missing token
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { getCsrfToken }; 