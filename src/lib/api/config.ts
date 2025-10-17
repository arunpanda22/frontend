import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import axiosRetry from 'axios-retry';
import { auth } from '@/lib/firebase';
import { handleAuthError } from '@/lib/utils/error-handler';

// Environment-aware base URL determination
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isDevelopment ? "http://localhost:8000" : "https://api.pacepivot.com");

console.log(`API base URL: ${API_BASE_URL} (${isDevelopment ? 'development' : 'production'})`);

export const DEFAULT_TIMEOUT = 300000; // 5 minutes
export const LONG_OPERATION_TIMEOUT = 300000; // 5 minutes

// Token storage keys
const STORAGE_KEYS = {
  JWT_ACCESS: 'jwt_access_token',
  JWT_REFRESH: 'jwt_refresh_token',
  JWT_EXPIRES_AT: 'jwt_expires_at', // 🔧 NEW: Track token expiry
  IMPERSONATION_ACTIVE: 'impersonation_active',
  ORIGINAL_USER: 'original_user_data',
} as const;

// 🔧 JWT token refresh constants
const JWT_TOKEN_LIFETIME = 10 * 60 * 1000; // 55 minutes (Django default is 60min)
const JWT_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry
let jwtRefreshPromise: Promise<string | null> | null = null;

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
const TOKEN_VALIDITY_PERIOD = 10 * 60 * 1000; // 55 minutes

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

// 🔧 NEW: Get JWT token expiry time
function getJWTExpiresAt(): number {
  if (typeof window === 'undefined') return 0;
  const expiresAt = localStorage.getItem(STORAGE_KEYS.JWT_EXPIRES_AT);
  return expiresAt ? parseInt(expiresAt, 10) : 0;
}

// 🔧 NEW: Check if JWT token needs refresh
function shouldRefreshJWT(): boolean {
  const expiresAt = getJWTExpiresAt();
  if (!expiresAt) return false;
  
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  
  // Refresh if token expires in less than 5 minutes
  return timeUntilExpiry < JWT_REFRESH_BUFFER;
}

// 🔧 NEW: Check if JWT token is expired
function isJWTExpired(): boolean {
  const expiresAt = getJWTExpiresAt();
  if (!expiresAt) return true;
  
  return Date.now() >= expiresAt;
}

export function setJWTTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  
  const expiresAt = Date.now() + JWT_TOKEN_LIFETIME;
  
  localStorage.setItem(STORAGE_KEYS.JWT_ACCESS, accessToken);
  localStorage.setItem(STORAGE_KEYS.JWT_REFRESH, refreshToken);
  localStorage.setItem(STORAGE_KEYS.JWT_EXPIRES_AT, expiresAt.toString());
  localStorage.setItem(STORAGE_KEYS.IMPERSONATION_ACTIVE, 'true');
  
  if (isDevelopment) {
    console.log('🔑 JWT tokens stored, expires at:', new Date(expiresAt).toLocaleTimeString());
  }
}

export function clearJWTTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.JWT_ACCESS);
  localStorage.removeItem(STORAGE_KEYS.JWT_REFRESH);
  localStorage.removeItem(STORAGE_KEYS.JWT_EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_ACTIVE);
  localStorage.removeItem(STORAGE_KEYS.ORIGINAL_USER);
  
  // Clear refresh promise
  jwtRefreshPromise = null;
  
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

// 🔧 IMPROVED: Refresh JWT access token using refresh token
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
      `${API_BASE_URL}/api/v1/auth/token-refresh/`,
      { refresh: refreshToken },
      { timeout: 10000 }
    );

    if (response.data?.access) {
      const newAccessToken = response.data.access;
      const expiresAt = Date.now() + JWT_TOKEN_LIFETIME;
      
      localStorage.setItem(STORAGE_KEYS.JWT_ACCESS, newAccessToken);
      localStorage.setItem(STORAGE_KEYS.JWT_EXPIRES_AT, expiresAt.toString());
      
      if (isDevelopment) {
        console.log('✅ JWT access token refreshed, expires at:', new Date(expiresAt).toLocaleTimeString());
      }
      
      return newAccessToken;
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ JWT token refresh failed:', error?.response?.data || error.message);
    
    // If refresh token is invalid/expired, clear everything
    if (error?.response?.status === 401) {
      console.warn('⚠️ Refresh token invalid, ending impersonation');
      clearJWTTokens();
    }
    
    return null;
  } finally {
    jwtRefreshPromise = null;
  }
}

// 🔧 NEW: Get valid JWT token (with auto-refresh)
async function getValidJWTToken(): Promise<string | null> {
  const currentToken = getJWTAccessToken();
  
  // No token at all
  if (!currentToken) {
    return null;
  }
  
  // Token is expired - must refresh
  if (isJWTExpired()) {
    if (isDevelopment) {
      console.log('⏰ JWT token expired, refreshing...');
    }
    return await refreshJWTAccessToken();
  }
  
  // Token expires soon - refresh proactively
  if (shouldRefreshJWT()) {
    if (isDevelopment) {
      console.log('⚠️ JWT token expiring soon, refreshing proactively...');
    }
    
    // Use promise to prevent multiple concurrent refresh requests
    if (!jwtRefreshPromise) {
      jwtRefreshPromise = refreshJWTAccessToken();
    }
    
    const newToken = await jwtRefreshPromise;
    return newToken || currentToken; // Fall back to current token if refresh fails
  }
  
  // Token is still valid
  return currentToken;
}

// 🔧 IMPROVED: Main authentication interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Check if we're in an impersonation session
      if (isImpersonating()) {
        // Get valid JWT token (with auto-refresh)
        const jwtToken = await getValidJWTToken();
        
        if (!jwtToken) {
          console.warn('⚠️ Impersonation active but no valid JWT token');
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

// 🔧 IMPROVED: Response interceptor with better JWT refresh handling
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
        // Check if JWT token is expired
        if (isJWTExpired()) {
          if (isDevelopment) {
            console.log('🔄 JWT expired, attempting refresh...');
          }

          // Try to refresh JWT token
          const newAccessToken = await refreshJWTAccessToken();
          
          if (newAccessToken) {
            // Retry the original request with new token
            originalRequest.headers = originalRequest.headers || new AxiosHeaders();
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            
            if (isDevelopment) {
              console.log('✅ Retrying request with refreshed JWT');
            }
            
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
      const expiryInfo = isImpersonating() 
        ? `expires: ${new Date(getJWTExpiresAt()).toLocaleTimeString()}`
        : '';
      console.log(`🔑 ${tokenType} Token:`, `${authHeader.substring(0, 20)}...`, expiryInfo, "URL:", url);
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