import { Injectable } from '@angular/core';

/**
 * Toggles the light/dark theme by switching the `lightMode`/`darkMode` class
 * on <html> and <body>. All colors come from the compiled Material 3 theme
 * in styles.scss (--mat-sys-*) plus the --app-* tokens — this service must
 * NOT set color properties imperatively, otherwise it fights the CSS theme.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'tovedem-theme';
  private isDark = false;

  constructor() {
    // Load theme from localStorage or default to light
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
    this.isDark = savedTheme === 'dark';
    this.applyTheme(this.isDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    this.applyTheme(this.isDark ? 'dark' : 'light');
    localStorage.setItem(
      this.THEME_STORAGE_KEY,
      this.isDark ? 'dark' : 'light'
    );
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const htmlElement = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      htmlElement.classList.add('darkMode');
      htmlElement.classList.remove('lightMode');
      body.classList.add('darkMode');
      body.classList.remove('lightMode');
    } else {
      htmlElement.classList.add('lightMode');
      htmlElement.classList.remove('darkMode');
      body.classList.add('lightMode');
      body.classList.remove('darkMode');
    }
  }

  isDarkTheme(): boolean {
    return this.isDark;
  }
}
