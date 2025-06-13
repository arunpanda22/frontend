import { AxiosError } from 'axios';
import { auth } from '@/lib/firebase';
import { authService } from '@/lib/services/auth';

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ErrorWithMessage {
  message: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (error as AxiosError)?.isAxiosError === true;
}

export async function handleAuthError(error: unknown): Promise<void> {
  if (isAxiosError(error) && error.response?.status === 401) {
    try {
      // Try to refresh the token and verify with backend
      await authService.verifyTokenWithBackend();
    } catch (refreshError) {
      // If refresh fails, sign out the user
      await auth?.signOut();
      window.location.href = '/login';
    }
  }
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Handle Axios error responses
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    if (!error.response) {
      return 'Network error. Please check your connection.';
    }
    // Handle specific HTTP status codes
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  if (isErrorWithMessage(error)) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export function getErrorDetails(error: unknown): {
  message: string;
  status?: number;
  isServerError: boolean;
  details?: string;
} {
  if (isAxiosError(error)) {
    const details = error.response?.data?.details
      ? JSON.stringify(error.response.data.details, null, 2)
      : undefined;

    return {
      message: getErrorMessage(error),
      status: error.response?.status,
      isServerError: error.response?.status === 500,
      details,
    };
  }

  return {
    message: getErrorMessage(error),
    isServerError: false,
  };
} 