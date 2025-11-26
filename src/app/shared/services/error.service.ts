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
   * PocketBase can return errors in different formats:
   * - General message: error.response.message
   * - Field-specific errors: error.response.data.email.message, error.response.data.username.message, etc.
   * - Arrays of messages: error.response.data.email = ["message1", "message2"]
   */
  extractPocketBaseMessage(error: PocketBaseError): string | null {
    // First try to get field-specific errors (most common for validation)
    const data = error.response?.data || error.data;
    if (data && typeof data === 'object') {
      // Check for field-specific errors (email, username, etc.)
      for (const [key, value] of Object.entries(data)) {
        if (key !== 'message') {
          // Handle array of messages (common in PocketBase)
          if (Array.isArray(value) && value.length > 0) {
            const firstMessage = typeof value[0] === 'string' ? value[0] : String(value[0]);
            if (firstMessage) {
              return this.translatePocketBaseError(firstMessage, key);
            }
          }
          // Handle object with message property
          else if (value && typeof value === 'object' && 'message' in value) {
            const fieldMessage = (value as { message: string }).message;
            if (fieldMessage) {
              return this.translatePocketBaseError(fieldMessage, key);
            }
          }
          // Handle direct string value
          else if (typeof value === 'string' && value) {
            return this.translatePocketBaseError(value, key);
          }
        }
      }
      
      // Check for general message in data
      if ('message' in data) {
        const message = data.message;
        if (typeof message === 'string') {
          return this.translatePocketBaseError(message);
        }
        if (Array.isArray(message)) {
          const messageArray = message as unknown[];
          if (messageArray.length > 0) {
            const firstMessage = typeof messageArray[0] === 'string' ? messageArray[0] : String(messageArray[0]);
            return this.translatePocketBaseError(firstMessage);
          }
        }
      }
    }

    // Try different possible locations for the error message
    if (error.response?.message) {
      const responseMessage = error.response.message;
      if (typeof responseMessage === 'string') {
        return this.translatePocketBaseError(responseMessage);
      }
      if (Array.isArray(responseMessage)) {
        const responseMessageArray = responseMessage as unknown[];
        if (responseMessageArray.length > 0) {
          const firstMessage = typeof responseMessageArray[0] === 'string' ? responseMessageArray[0] : String(responseMessageArray[0]);
          return this.translatePocketBaseError(firstMessage);
        }
      }
    }
    if (error.message) {
      return this.translatePocketBaseError(error.message);
    }
    return null;
  }

  /**
   * Translate PocketBase error messages to Dutch
   */
  private translatePocketBaseError(message: string, field?: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Email already exists (check multiple variations)
    if ((lowerMessage.includes('email') || field?.toLowerCase() === 'email') && 
        (lowerMessage.includes('already') || lowerMessage.includes('exists') || 
         lowerMessage.includes('taken') || lowerMessage.includes('in use') ||
         lowerMessage.includes('duplicate') || lowerMessage.includes('must be unique'))) {
      return 'Dit e-mailadres is al in gebruik. Gebruik een ander e-mailadres of log in met dit account.';
    }
    
    // Username already exists
    if ((lowerMessage.includes('username') || field?.toLowerCase() === 'username') && 
        (lowerMessage.includes('already') || lowerMessage.includes('exists') || 
         lowerMessage.includes('taken') || lowerMessage.includes('in use') ||
         lowerMessage.includes('duplicate') || lowerMessage.includes('must be unique'))) {
      return 'Deze gebruikersnaam is al in gebruik. Kies een andere gebruikersnaam.';
    }
    
    // Invalid email format
    if ((lowerMessage.includes('email') || field?.toLowerCase() === 'email') && 
        (lowerMessage.includes('invalid') || lowerMessage.includes('format') || 
         lowerMessage.includes('not valid') || lowerMessage.includes('malformed'))) {
      return 'Het e-mailadres heeft een ongeldig formaat. Controleer het e-mailadres en probeer het opnieuw.';
    }
    
    // Password too short
    if ((lowerMessage.includes('password') || field?.toLowerCase() === 'password') && 
        (lowerMessage.includes('too short') || lowerMessage.includes('minimum') || 
         lowerMessage.includes('at least'))) {
      return 'Het wachtwoord is te kort. Gebruik minimaal 8 tekens.';
    }
    
    // Required field
    if (lowerMessage.includes('required') || lowerMessage.includes('cannot be blank') || 
        lowerMessage.includes('is required') || lowerMessage.includes('must not be empty')) {
      const fieldName = field ? this.getFieldNameDutch(field) : 'veld';
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is verplicht.`;
    }
    
    // Record not found
    if (lowerMessage.includes('not found') || lowerMessage.includes('missing') || 
        lowerMessage.includes('does not exist')) {
      return 'Het gevraagde item is niet gevonden.';
    }
    
    // Permission denied
    if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized') || 
        lowerMessage.includes('forbidden') || lowerMessage.includes('access denied')) {
      return 'U heeft geen toestemming voor deze actie.';
    }
    
    // Failed to create/update record
    if (lowerMessage.includes('failed to create') || lowerMessage.includes('failed to update')) {
      return 'Het aanmaken van het account is mislukt. Controleer de ingevoerde gegevens en probeer het opnieuw.';
    }
    
    // Return original message if no translation found (PocketBase messages are often already user-friendly)
    return message;
  }

  /**
   * Get Dutch field name for common fields
   */
  private getFieldNameDutch(field: string): string {
    const fieldMap: Record<string, string> = {
      email: 'e-mailadres',
      username: 'gebruikersnaam',
      password: 'wachtwoord',
      passwordConfirm: 'wachtwoord bevestigen',
      name: 'naam',
      surname: 'achternaam',
    };
    
    return fieldMap[field.toLowerCase()] || field;
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

