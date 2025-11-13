import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    // Always apply dark theme
    this.applyDarkTheme();
  }

  private applyDarkTheme(): void {
    const htmlElement = document.documentElement;
    htmlElement.classList.add('darkMode');
    document.body.classList.add('darkMode');
  }

  isDarkTheme(): boolean {
    return true; // Always dark theme
  }
}
