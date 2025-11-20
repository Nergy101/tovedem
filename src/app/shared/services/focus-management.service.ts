import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

/**
 * Focus Management Service
 * Handles focus management for accessibility:
 * - Focus restoration after route changes
 * - Focus trap for modals/dialogs
 * - Skip link functionality
 */
@Injectable({
  providedIn: 'root',
})
export class FocusManagementService {
  private router = inject(Router);
  private previousFocusElement: HTMLElement | null = null;
  private focusableElements: string =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  constructor() {
    // Restore focus to main content after route changes
    this.router.events
      .pipe(
        filter((event: unknown) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.focusMainContent();
      });
  }

  /**
   * Focus the main content area after route navigation
   */
  focusMainContent(): void {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        // Remove focus after a moment (for screen readers to announce)
        setTimeout(() => {
          mainContent.blur();
        }, 100);
      }
    }, 100);
  }

  /**
   * Save the currently focused element
   */
  saveFocus(): void {
    this.previousFocusElement =
      (document.activeElement as HTMLElement) || null;
  }

  /**
   * Restore focus to the previously focused element
   */
  restoreFocus(): void {
    if (this.previousFocusElement) {
      this.previousFocusElement.focus();
      this.previousFocusElement = null;
    }
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(this.focusableElements)
    );
    return elements.filter((el) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    });
  }

  /**
   * Trap focus within a container (for modals/dialogs)
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Focus an element by ID
   */
  focusElementById(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Skip to main content (for skip links)
   */
  skipToMainContent(): void {
    this.focusElementById('main-content');
  }

  /**
   * Skip to navigation
   */
  skipToNavigation(): void {
    const nav = document.querySelector('nav');
    if (nav) {
      const firstFocusable = this.getFocusableElements(nav)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }

  /**
   * Skip to footer
   */
  skipToFooter(): void {
    const footer = document.querySelector('footer');
    if (footer) {
      const firstFocusable = this.getFocusableElements(footer)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }
}

