import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import axiosRetry from 'axios-retry';
import { auth } from '@/lib/firebase';
import { handleAuthError } from '@/lib/utils/error-handler';

// Environment-aware base URL determination
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isDevelopment ? "http://localhost:8000" : "https://django-backend-epcse2awb3cyh5e8.centralindia-01.azurewebsites.net");

console.log(`API base URL: ${API_BASE_URL} (${isDevelopment ? 'development' : 'production'})`);

export const DEFAULT_TIMEOUT = 300000; // 5 minutes
export const LONG_OPERATION_TIMEOUT = 300000; // 5 minutes

// Token storage keys
const STORAGE_KEYS = {
  JWT_ACCESS: 'jwt_access_token',
  JWT_REFRESH: 'jwt_refresh_token',
  IMPERSONATION_ACTIVE: 'impersonation_active',
  ORIGINAL_USER: 'original_user_data',
} as const;

// Create axios instance
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

// Firebase token cache
let cachedFirebaseToken: string | null = null;
let firebaseTokenExpiry: number = 0;
let firebaseTokenPromise: Promise<string> | null = null;
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes buffer
const TOKEN_VALIDITY_PERIOD = 55 * 60 * 1000; // 55 minutes

// Helper functions for token storage
export function isImpersonating(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.IMPERSONATION_ACTIVE) === 'true';
}

export function getJWTAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.JWT_ACCESS);
}

export function getJWTRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.JWT_REFRESH);
}

export function setJWTTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.JWT_ACCESS, accessToken);
  localStorage.setItem(STORAGE_KEYS.JWT_REFRESH, refreshToken);
  localStorage.setItem(STORAGE_KEYS.IMPERSONATION_ACTIVE, 'true');
}

export function clearJWTTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.JWT_ACCESS);
  localStorage.removeItem(STORAGE_KEYS.JWT_REFRESH);
  localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_ACTIVE);
  localStorage.removeItem(STORAGE_KEYS.ORIGINAL_USER);
  
  if (isDevelopment) {
    console.log('🧹 Cleared JWT tokens and impersonation state');
  }
}

export function clearAuthTokenCache() {
  if (isDevelopment) {
    console.log('🧹 Clearing Firebase token cache');
  }
  cachedFirebaseToken = null;
  firebaseTokenExpiry = 0;
  firebaseTokenPromise = null;
}

// Helper to check if Firebase token is valid
function isFirebaseTokenValid(): boolean {
  const now = Date.now();
  return !!(cachedFirebaseToken && now < firebaseTokenExpiry - TOKEN_REFRESH_BUFFER);
}

// Helper to get fresh Firebase token
async function getFreshFirebaseToken(currentUser: any, forceRefresh: boolean = false): Promise<string> {
  const now = Date.now();
  
  if (isDevelopment) {
    console.log(`🔄 Fetching ${forceRefresh ? 'force-refreshed' : 'fresh'} Firebase token`);
  }
  
  try {
    const token = await currentUser.getIdToken(forceRefresh);
    cachedFirebaseToken = token;
    firebaseTokenExpiry = now + TOKEN_VALIDITY_PERIOD;
    
    if (isDevelopment) {
      console.log('✅ Firebase token obtained:', {
        length: token.length,
        expiresAt: new Date(firebaseTokenExpiry).toLocaleTimeString(),
        forceRefresh
      });
    }
    
    return token;
  } catch (error) {
    cachedFirebaseToken = null;
    firebaseTokenExpiry = 0;
    if (isDevelopment) {
      console.error('❌ Firebase token fetch failed:', error);
    }
    throw error;
  }
}

// Refresh JWT access token using refresh token
async function refreshJWTAccessToken(): Promise<string | null> {
  const refreshToken = getJWTRefreshToken();
  
  if (!refreshToken) {
    if (isDevelopment) {
      console.log('❌ No JWT refresh token available');
    }
    return null;
  }

  try {
    if (isDevelopment) {
      console.log('🔄 Refreshing JWT access token');
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/token/refresh/`,
      { refresh: refreshToken },
      { timeout: 10000 }
    );

    if (response.data?.access) {
      const newAccessToken = response.data.access;
      localStorage.setItem(STORAGE_KEYS.JWT_ACCESS, newAccessToken);
      
      if (isDevelopment) {
        console.log('✅ JWT access token refreshed');
      }
      
      return newAccessToken;
    }
    
    return null;
  } catch (error) {
    console.error('❌ JWT token refresh failed:', error);
    // Clear JWT tokens on refresh failure
    clearJWTTokens();
    return null;
  }
}

// Main authentication interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Check if we're in an impersonation session
      if (isImpersonating()) {
        // Use JWT token for impersonation
        let jwtToken = getJWTAccessToken();
        
        if (!jwtToken) {
          console.warn('⚠️ Impersonation active but no JWT token found');
          clearJWTTokens();
          return config;
        }

        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        
        config.headers.set('Authorization', `Bearer ${jwtToken}`);
        
        if (isDevelopment) {
          console.log('🔑 Using JWT token (impersonation)');
        }
        
        return config;
      }

      // Normal flow - use Firebase token
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        return config; // No user, proceed without auth header
      }

      // Use cached Firebase token if still valid
      if (isFirebaseTokenValid()) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('Authorization', `Bearer ${cachedFirebaseToken}`);
        return config;
      }

      // Handle concurrent Firebase token requests
      if (firebaseTokenPromise) {
        if (isDevelopment) {
          console.log('⏳ Waiting for existing Firebase token request...');
        }
        cachedFirebaseToken = await firebaseTokenPromise;
      } else {
        // Create new Firebase token request
        firebaseTokenPromise = getFreshFirebaseToken(currentUser, false)
          .finally(() => {
            firebaseTokenPromise = null;
          });
        
        cachedFirebaseToken = await firebaseTokenPromise;
      }

      if (cachedFirebaseToken) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('Authorization', `Bearer ${cachedFirebaseToken}`);
      }

    } catch (error) {
      console.error('Error getting auth token:', error);
      clearAuthTokenCache();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for auth errors and JWT refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const originalRequest = error.config;

    // Log errors in development
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

    // Handle 401 errors
    if (status === 401 && originalRequest) {
      // Check if we're in impersonation mode
      if (isImpersonating()) {
        // Try to refresh JWT token
        if (!originalRequest.headers?.['X-JWT-Retry']) {
          if (isDevelopment) {
            console.log('🔄 Attempting JWT token refresh...');
          }

          const newAccessToken = await refreshJWTAccessToken();
          
          if (newAccessToken) {
            // Retry the original request with new token
            originalRequest.headers = originalRequest.headers || new AxiosHeaders();
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            originalRequest.headers.set('X-JWT-Retry', 'true');
            
            return apiClient.request(originalRequest);
          } else {
            // JWT refresh failed, end impersonation
            console.warn('⚠️ JWT refresh failed, ending impersonation session');
            clearJWTTokens();
            // Reload to return to normal Firebase auth
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        }
      } else {
        // Normal Firebase auth - handle as before
        console.warn('🔐 Auth error 401 detected. Clearing Firebase token cache...');
        clearAuthTokenCache();
        await handleAuthError(error);
      }
    }

    // Handle 403 errors
    if (status === 403 && originalRequest) {
      if (isImpersonating()) {
        // For impersonation, 403 might mean permissions changed
        console.warn('⚠️ Permission denied during impersonation');
      } else {
        // Try refreshing Firebase token
        if (!originalRequest.headers?.['X-Retry-Auth']) {
          try {
            const currentUser = auth?.currentUser;
            if (currentUser) {
              if (isDevelopment) {
                console.log('🔄 Retrying with force-refreshed Firebase token...');
              }
              
              const freshToken = await getFreshFirebaseToken(currentUser, true);
              
              originalRequest.headers = originalRequest.headers || new AxiosHeaders();
              originalRequest.headers.set('Authorization', `Bearer ${freshToken}`);
              originalRequest.headers.set('X-Retry-Auth', 'true');

              return apiClient.request(originalRequest);
            }
          } catch (retryError) {
            console.error('❌ Firebase token refresh retry failed:', retryError);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// Debug interceptor for development
if (isDevelopment) {
  apiClient.interceptors.request.use(request => {
    const url = request.url;
    const authHeader = request.headers?.Authorization as string;
    
    if (authHeader) {
      const tokenType = isImpersonating() ? 'JWT' : 'Firebase';
      console.log(`🔑 ${tokenType} Token:`, `${authHeader.substring(0, 20)}...`, "URL:", url);
    }
    
    if (!url?.includes('verify-token') && !url?.includes('auth')) {
      console.log('🌐 API Request:', {
        method: request.method?.toUpperCase(),
        url,
        hasAuth: !!authHeader,
        impersonating: isImpersonating()
      });
    }
    return request;
  });
}

// CSRF token management
let csrfToken: string | null = null;

const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
    
    if (csrfCookie) {
      const token = csrfCookie.split('=')[1];
      if (token) {
        csrfToken = token;
        return token;
      }
    }

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

// CSRF token interceptor
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
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export { getCsrfToken };