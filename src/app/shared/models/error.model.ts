/**
 * Error handling models and types for consistent error management across the application
 */

/**
 * Error types that can occur in the application
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Standardized error structure used throughout the application
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError: unknown;
  statusCode?: number;
  code?: string | number;
  context?: string;
}

/**
 * PocketBase error structure
 * PocketBase errors can have different structures:
 * - error.response.message
 * - error.data.message
 * - error.message
 * - error.status
 * - error.response.code
 */
export interface PocketBaseError {
  response?: {
    message?: string;
    code?: number;
    data?: {
      message?: string;
      [key: string]: unknown;
    };
  };
  data?: {
    message?: string;
    [key: string]: unknown;
  };
  message?: string;
  status?: number;
  [key: string]: unknown;
}

/**
 * Type guard to check if an error is a PocketBase error
 */
export function isPocketBaseError(error: unknown): error is PocketBaseError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as Record<string, unknown>;
  return (
    err.response !== undefined ||
    err.data !== undefined ||
    err.status !== undefined ||
    typeof err.message === 'string'
  );
}

/**
 * Type guard to check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('network') ||
      error.name === 'NetworkError'
    );
  }
  return false;
}

/**
 * Type guard to check if error has HTTP status code
 */
export function hasStatusCode(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

