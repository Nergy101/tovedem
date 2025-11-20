import { Injectable, inject } from '@angular/core';
import {
  AppError,
  ErrorType,
  PocketBaseError,
  isPocketBaseError,
  isNetworkError,
  hasStatusCode,
} from '../models/error.model';
import { Environment } from '../../../environment';

/**
 * Central error handling service - single source of truth for all error parsing and formatting
 * This service ensures DRY principles by centralizing all error handling logic
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private environment = inject(Environment);

  /**
   * Parse any error into a standardized AppError structure
   */
  parseError(error: unknown, context?: string): AppError {
    const errorType = this.categorizeError(error);
    const message = this.extractErrorMessage(error);
    const statusCode = this.extractStatusCode(error);
    const code = this.extractErrorCode(error);

    return {
      type: errorType,
      message,
      originalError: error,
      statusCode,
      code,
      context,
    };
  }

  /**
   * Categorize an error into one of the ErrorType categories
   */
  categorizeError(error: unknown): ErrorType {
    // Check for network errors first
    if (isNetworkError(error)) {
      return ErrorType.NETWORK;
    }

    // Check if it's a PocketBase error
    if (isPocketBaseError(error)) {
      const status = error.status ?? error.response?.code;
      
      if (status === 401) {
        return ErrorType.AUTHENTICATION;
      }
      if (status === 403) {
        return ErrorType.AUTHORIZATION;
      }
      if (status === 400 || status === 422) {
        return ErrorType.VALIDATION;
      }
      if (status && status >= 500) {
        return ErrorType.SERVER;
      }
    }

    // Check for HTTP status codes
    if (hasStatusCode(error)) {
      const status = error.status;
      if (status === 401) {
        return ErrorType.AUTHENTICATION;
      }
      if (status === 403) {
        return ErrorType.AUTHORIZATION;
      }
      if (status === 400 || status === 422) {
        return ErrorType.VALIDATION;
      }
      if (status >= 500) {
        return ErrorType.SERVER;
      }
    }

    // Check for offline/network issues
    if (error instanceof Error) {
      if (
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('timeout') ||
        error.message.includes('CORS')
      ) {
        return ErrorType.NETWORK;
      }
    }

    // Default to unknown
    return ErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly Dutch error message
   */
  getUserMessage(error: AppError): string {
    // If we have a PocketBase message, use it (it's usually already user-friendly)
    if (isPocketBaseError(error.originalError)) {
      const pbMessage = this.extractPocketBaseMessage(error.originalError);
      if (pbMessage) {
        return pbMessage;
      }
    }

    // Otherwise, use default messages based on error type
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Er is een probleem met de verbinding. Controleer uw internetverbinding en probeer het opnieuw.';
      
      case ErrorType.VALIDATION:
        return error.message || 'De ingevoerde gegevens zijn ongeldig. Controleer de velden en probeer het opnieuw.';
      
      case ErrorType.AUTHENTICATION:
        return 'U bent niet ingelogd. Log alstublieft in om door te gaan.';
      
      case ErrorType.AUTHORIZATION:
        return 'U heeft geen toegang tot deze actie. Neem contact op met een beheerder als u denkt dat dit een fout is.';
      
      case ErrorType.SERVER:
        return 'Er is een probleem op de server. Probeer het later opnieuw. Als het probleem aanhoudt, neem dan contact met ons op.';
      
      case ErrorType.UNKNOWN:
      default:
        return error.message || 'Er is een onverwachte fout opgetreden. Probeer het later opnieuw.';
    }
  }

  /**
   * Convenience method that combines parseError and getUserMessage
   */
  getErrorMessage(error: unknown, context?: string): string {
    const appError = this.parseError(error, context);
    return this.getUserMessage(appError);
  }

  /**
   * Extract error message from PocketBase error structure
   */
  extractPocketBaseMessage(error: PocketBaseError): string | null {
    // Try different possible locations for the error message
    if (error.response?.message) {
      return error.response.message;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.data?.message) {
      return error.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return null;
  }

  /**
   * Extract HTTP status code from error
   */
  private extractStatusCode(error: unknown): number | undefined {
    if (isPocketBaseError(error)) {
      return error.status ?? error.response?.code;
    }
    if (hasStatusCode(error)) {
      return error.status;
    }
    return undefined;
  }

  /**
   * Extract error code from error
   */
  private extractErrorCode(error: unknown): string | number | undefined {
    if (isPocketBaseError(error)) {
      return error.response?.code;
    }
    return undefined;
  }

  /**
   * Extract error message from any error type
   */
  private extractErrorMessage(error: unknown): string {
    if (isPocketBaseError(error)) {
      const message = this.extractPocketBaseMessage(error);
      if (message) {
        return message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Onbekende fout';
  }

  /**
   * Determine if an error should be logged
   */
  shouldLogError(error: AppError): boolean {
    // Don't log validation errors (user input issues)
    if (error.type === ErrorType.VALIDATION) {
      return false;
    }
    // Log all other errors
    return true;
  }

  /**
   * Centralized error logging
   */
  logError(error: AppError, context?: string): void {
    if (!this.shouldLogError(error)) {
      return;
    }

    const logContext = context || error.context || 'Application';
    const logMessage = `[${logContext}] ${error.type}: ${error.message}`;

    if (this.environment.production) {
      // In production, log to console with minimal details
      console.error(logMessage, {
        type: error.type,
        statusCode: error.statusCode,
        code: error.code,
      });
    } else {
      // In development, log full error details
      console.error(logMessage, {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        context: error.context,
        originalError: error.originalError,
      });
    }

    // Future: Could extend to send to analytics/error tracking service
    // Example: this.analyticsService.logError(error);
  }
}

