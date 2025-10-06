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

// Enhanced token cache with proper management
let cachedToken: string | null = null;
let tokenExpiry: number = 0;
let tokenPromise: Promise<string> | null = null;
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry
const TOKEN_VALIDITY_PERIOD = 55 * 60 * 1000; // 55 minutes (Firebase tokens valid for 1 hour)

// Expose a helper to clear the token cache
export function clearAuthTokenCache() {
  if (isDevelopment) {
    console.log('🧹 Clearing auth token cache');
  }
  cachedToken = null;
  tokenExpiry = 0;
  tokenPromise = null;
}

// Helper to check if current token is valid
function isTokenValid(): boolean {
  const now = Date.now();
  return !!(cachedToken && now < tokenExpiry - TOKEN_REFRESH_BUFFER);
}

// Helper to get fresh token
async function getFreshToken(currentUser: any, forceRefresh: boolean = false): Promise<string> {
  const now = Date.now();
  
  if (isDevelopment) {
    console.log(`🔄 Fetching ${forceRefresh ? 'force-refreshed' : 'fresh'} Firebase token`);
  }
  
  try {
    const token = await currentUser.getIdToken(forceRefresh);
    cachedToken = token;
    tokenExpiry = now + TOKEN_VALIDITY_PERIOD;
    
    if (isDevelopment) {
      console.log('✅ Firebase token obtained:', {
        length: token.length,
        expiresAt: new Date(tokenExpiry).toLocaleTimeString(),
        forceRefresh
      });
    }
    
    return token;
  } catch (error) {
    cachedToken = null;
    tokenExpiry = 0;
    if (isDevelopment) {
      console.error('❌ Token fetch failed:', error);
    }
    throw error;
  }
}

// Authentication interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        return config; // No user, proceed without auth header
      }

      // Use cached token if still valid
      if (isTokenValid()) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('Authorization', `Bearer ${cachedToken}`);
        return config;
      }

      // Handle concurrent token requests
      if (tokenPromise) {
        if (isDevelopment) {
          console.log('⏳ Waiting for existing token request...');
        }
        cachedToken = await tokenPromise;
      } else {
        // Create new token request
        tokenPromise = getFreshToken(currentUser, false)
          .finally(() => {
            // Clear promise after completion
            tokenPromise = null;
          });
        
        cachedToken = await tokenPromise;
      }

      if (cachedToken) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('Authorization', `Bearer ${cachedToken}`);
      }

    } catch (error) {
      console.error('Error getting auth token:', error);
      clearAuthTokenCache();
      // Don't throw here, let the request proceed and let the backend handle it
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
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Log errors in development (with noise reduction)
    if (isDevelopment) {
      const isVerifyToken = url.includes('/api/v1/auth/verify-token/');
      const isExpectedBootstrap = isVerifyToken && status === 400;
      
      if (!isExpectedBootstrap) {
        console.error('Response Error:', {
          message: error.message,
          status,
          url,
          data: error.response?.data,
        });
      }
    }

    // Handle authentication errors
    if (status === 401 || status === 403) {
      console.warn(`🔐 Auth error ${status} detected. Clearing token cache...`);
      clearAuthTokenCache();

      // Try one retry with force-refreshed token for 403 errors
      if (status === 403 && !error.config?.headers?.['X-Retry-Auth']) {
        try {
          const currentUser = auth?.currentUser;
          if (currentUser && error.config) {
            if (isDevelopment) {
              console.log('🔄 Retrying with force-refreshed token...');
            }
            
            // Force refresh token
            const freshToken = await getFreshToken(currentUser, true);
            
            // Mark request as retry and add fresh token
            const retryConfig = {
              ...error.config,
              headers: {
                ...error.config.headers,
                'Authorization': `Bearer ${freshToken}`,
                'X-Retry-Auth': 'true' // Prevent infinite retries
              }
            };

            return apiClient.request(retryConfig);
          }
        } catch (retryError) {
          console.error('❌ Token refresh retry failed:', retryError);
        }
      }

      // Handle auth error through error handler
      if (status === 401) {
        await handleAuthError(error);
      }
    }

    return Promise.reject(error);
  }
);

// Debug interceptor for development
if (isDevelopment) {
  apiClient.interceptors.request.use(request => {
    const url = request.url;
    
    // Log auth details
    const authHeader = request.headers?.Authorization as string;
    if (authHeader) {
      console.log('🔑 Authorization:', `${authHeader.substring(0, 20)}...`, "URL:", url);
    }

    console.log('🔑 Authorization:', request.headers?.Authorization);
    
    console.log('🛡️ CSRF Token:', request.headers?.['X-CSRFToken']);
    
    // Only log non-auth requests to reduce noise
    if (!url?.includes('verify-token') && !url?.includes('auth')) {
      console.log('🌐 API Request:', {
        method: request.method?.toUpperCase(),
        url,
        hasAuth: !!authHeader
      });
    }
    return request;
  });
}

// CSRF token management (simplified)
let csrfToken: string | null = null;

const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    // Try to get from cookie first
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
    
    if (csrfCookie) {
      const token = csrfCookie.split('=')[1];
      if (token) {
        csrfToken = token;
        return token;
      }
    }

    // Fetch from server if not in cookie
    console.log('Fetching CSRF token from server...');
    const response = await axios.get(`${API_BASE_URL}/api/v1/get-csrf-token/`, {
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const token = response.data?.csrfToken;
    if (token) {
      csrfToken = token;
      return token;
    }

    // Check cookies again after server call
    const updatedCookies = document.cookie.split(';');
    const updatedCsrfCookie = updatedCookies.find(cookie => cookie.trim().startsWith('csrftoken='));
    if (updatedCsrfCookie) {
      const cookieToken = updatedCsrfCookie.split('=')[1];
      if (cookieToken) {
        csrfToken = cookieToken;
        return cookieToken;
      }
    }

    throw new Error('CSRF token not available');
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
};

// CSRF token interceptor (only for non-GET requests)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toLowerCase();
    if (method && method !== 'get') {
      try {
        const token = await getCsrfToken();
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers['X-CSRFToken'] = token;
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
      } catch (error) {
        console.warn('Failed to get CSRF token:', error);
        // Don't throw - let request proceed without CSRF token
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export { getCsrfToken };
