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

// Enhanced token cache to avoid excessive Firebase requests
let cachedToken: string | null = null;
let tokenExpiry: number = 0;
let tokenPromise: Promise<string> | null = null;
let lastTokenFetch: number = 0;
const MIN_TOKEN_INTERVAL = 2000; // Minimum 2 seconds between token fetches

// Expose a helper to clear the token cache (useful on explicit logout)
export function clearAuthTokenCache() {
  cachedToken = null;
  tokenExpiry = 0;
  tokenPromise = null;
  lastTokenFetch = 0;
}

// Authentication interceptor
// apiClient.interceptors.request.use(
//   async (config: InternalAxiosRequestConfig) => {
//     try {
//       const currentUser = auth?.currentUser;
//       if (currentUser) {
//         const now = Date.now();
        
//         // Use cached token if valid and not expired
//         if (cachedToken && now < tokenExpiry - 15 * 60 * 1000) { // 15-minute buffer
//           if (!config.headers) {
//             config.headers = new AxiosHeaders();
//           }
//           config.headers.set('Authorization', `Bearer ${cachedToken}`);
//           return config;
//         }
        
//         // Prevent excessive token requests by enforcing minimum interval
//         if (now - lastTokenFetch < MIN_TOKEN_INTERVAL && tokenPromise) {
//           if (process.env.NODE_ENV === 'development') {
//             console.log('⏳ Waiting for existing token request...');
//           }
//           cachedToken = await tokenPromise;
//         } else if (!cachedToken || now >= tokenExpiry - 15 * 60 * 1000) {
//           // Only fetch new token if cache is truly expired or missing
//           if (!tokenPromise || now - lastTokenFetch >= MIN_TOKEN_INTERVAL) {
//             lastTokenFetch = now;
//             if (process.env.NODE_ENV === 'development') {
//               console.log('🔄 Fetching fresh Firebase token (cache expired)');
//             }
            
//             tokenPromise = currentUser.getIdToken(true).then(token => {  // Force refresh
//               cachedToken = token;
//               // Firebase tokens are valid for 1 hour, set expiry with 15-minute buffer
//               tokenExpiry = now + 45 * 60 * 1000; // 45 minutes from now
//               if (process.env.NODE_ENV === 'development') {
//                 console.log('✅ Fresh Firebase token cached');
//               }
//               return token;
//             }).catch(error => {
//               // Clear cache and promise on error
//               cachedToken = null;
//               tokenExpiry = 0;
//               if (process.env.NODE_ENV === 'development') {
//                 console.error('❌ Token fetch failed:', error);
//               }
//               throw error;
//             }).finally(() => {
//               // Clear promise after completion (success or failure)
//               setTimeout(() => { tokenPromise = null; }, 1000);
//             });
//           }
          
//           if (tokenPromise) {
//             cachedToken = await tokenPromise;
//           }
//         }
        
//         if (!config.headers) {
//           config.headers = new AxiosHeaders();
//         }
//         config.headers.set('Authorization', `Bearer ${cachedToken}`);
//       }
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       // Clear all cache on error
//       cachedToken = null;
//       tokenExpiry = 0;
//       tokenPromise = null;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const currentUser = auth?.currentUser;
      if (currentUser) {
        // Always get a fresh token or reuse the pending promise
        if (!tokenPromise) {
          tokenPromise = currentUser.getIdToken(false) // Use cached token
            .catch(() => currentUser.getIdToken(true)) // Force refresh on error
            .finally(() => {
              // Clear promise after 55 minutes to force refresh
              setTimeout(() => { tokenPromise = null; }, 55 * 60 * 1000);
            });
        }
        
        const token = await tokenPromise;
        
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      tokenPromise = null; // Clear on error
    }
    return config;
  }
);

// Response interceptor for auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // In dev, log a compact error; avoid double noisy logs in production.
    // Suppress expected 400s from verify-token during initial auth bootstrap.
    if (process.env.NODE_ENV === 'development') {
      const url = error.config?.url || '';
      const status = error.response?.status;
      const isVerifyToken = url.includes('/api/v1/auth/verify-token/');
      const isExpectedBootstrap = isVerifyToken && status === 400;
      if (!isExpectedBootstrap) {
        console.error('Response Error:', {
          message: error.message,
          response: error.response?.data,
          status,
          url,
        });
      } else {
        console.warn('Auth bootstrap (expected) verify-token 400 suppressed');
      }
    }
    if (error.response?.status === 401) {
      // Clear all cached token data on 401 to force refresh
      clearAuthTokenCache();
      await handleAuthError(error);
    }
    return Promise.reject(error);
  }
);

// Debug interceptor for development (request only, response handled by main interceptor)
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(request => {
    // logging for developmet
    console.log('🔑 Authorization:', request.headers?.Authorization);
    console.log('🛡️ CSRF Token:', request.headers?.['X-CSRFToken']);
    // Only log non-auth requests to reduce noise
    if (!request.url?.includes('verify-token') && !request.url?.includes('auth')) {
      console.log('🌐 API Request:', {
        method: request.method?.toUpperCase(),
        url: request.url,
      });
    }
    return request;
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
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { getCsrfToken }; 