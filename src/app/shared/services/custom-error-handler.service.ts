/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ErrorService } from './error.service';

/**
 * Custom Error Handler Service
 * Handles unhandled application errors (not HTTP errors, which are handled by the interceptor)
 * Uses ErrorService for all error parsing (DRY principle)
 */
@Injectable({
  providedIn: 'root',
})
export class CustomErrorHandlerService implements ErrorHandler {
  private toastrService?: ToastrService;
  private errorService?: ErrorService;

  constructor(private injector: Injector) {}

  handleError(error: any): void {
    // Lazy inject services to avoid circular dependencies
    if (!this.toastrService) {
      this.toastrService = this.injector.get(ToastrService);
    }
    if (!this.errorService) {
      this.errorService = this.injector.get(ErrorService);
    }

    // Parse error using ErrorService (single source of truth)
    const appError = this.errorService.parseError(error, 'Unhandled Application Error');

    // Get user-friendly message
    const userMessage = this.errorService.getUserMessage(appError);

    // Log error using ErrorService
    this.errorService.logError(appError, 'Global Error Handler');

    // Show toast notification to user
    this.toastrService.error(userMessage, 'Fout', {
      positionClass: 'toast-bottom-right',
      timeOut: 7000,
    });
  }
}
