import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ErrorService } from '../services/error.service';

/**
 * HTTP Error Interceptor
 * Intercepts HTTP errors from PocketBase API calls and other HTTP requests
 * Uses ErrorService for all error parsing (DRY principle)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse | unknown) => {
      // Parse error using ErrorService (single source of truth)
      const appError = errorService.parseError(error, 'HTTP Request');

      // Get user-friendly message
      const userMessage = errorService.getUserMessage(appError);

      // Log error using ErrorService
      errorService.logError(appError, `HTTP ${req.method} ${req.url}`);

      // Show toast notification to user
      // Don't show toast for validation errors that components might want to handle
      if (appError.type !== 'VALIDATION') {
        toastr.error(userMessage, getErrorTitle(appError.type), {
          positionClass: 'toast-bottom-right',
          timeOut: appError.type === 'NETWORK' ? 10000 : 5000,
        });
      }

      // Return transformed error so components can still handle it if needed
      return throwError(() => appError);
    })
  );
};

/**
 * Get error title for toast notification
 */
function getErrorTitle(errorType: string): string {
  switch (errorType) {
    case 'NETWORK':
      return 'Verbindingsprobleem';
    case 'VALIDATION':
      return 'Validatiefout';
    case 'AUTHENTICATION':
      return 'Authenticatiefout';
    case 'AUTHORIZATION':
      return 'Geen toegang';
    case 'SERVER':
      return 'Serverfout';
    default:
      return 'Fout';
  }
}

