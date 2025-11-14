import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'tovedem-theme';
  private isDark = true;

  constructor() {
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (savedTheme === 'light') {
      this.isDark = false;
    }
    this.applyTheme(this.isDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    this.applyTheme(this.isDark ? 'dark' : 'light');
    localStorage.setItem(this.THEME_STORAGE_KEY, this.isDark ? 'dark' : 'light');
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const htmlElement = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      htmlElement.classList.add('darkMode');
      htmlElement.classList.remove('lightMode');
      body.classList.add('darkMode');
      body.classList.remove('lightMode');
      this.applyDarkMaterialTheme();
    } else {
      htmlElement.classList.add('lightMode');
      htmlElement.classList.remove('darkMode');
      body.classList.add('lightMode');
      body.classList.remove('darkMode');
      this.applyLightMaterialTheme();
    }
  }

  private applyDarkMaterialTheme(): void {
    // Dark theme Material Design variables
    document.documentElement.style.setProperty('--mat-sys-background', '#0f1218');
    document.documentElement.style.setProperty('--mat-sys-surface-container-lowest', '#1a1d24');
    document.documentElement.style.setProperty('--mat-sys-surface-container-low', '#1f2229');
    document.documentElement.style.setProperty('--mat-sys-surface-container', '#25282f');
    document.documentElement.style.setProperty('--mat-sys-surface-container-high', '#2b2e35');
    document.documentElement.style.setProperty('--mat-sys-surface', '#0f1218');
    document.documentElement.style.setProperty('--mat-sys-on-primary', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-on-primary-container', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-on-background', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-on-surface', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-on-surface-variant', '#e8e9eb');
    document.documentElement.style.setProperty('--mat-sys-on-surface-container', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-primary', '#7db3e8');
  }

  private applyLightMaterialTheme(): void {
    // Light theme Material Design variables - white backgrounds, black text, same blue accents
    document.documentElement.style.setProperty('--mat-sys-background', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-surface-container-lowest', '#f5f9fe');
    document.documentElement.style.setProperty('--mat-sys-surface-container-low', '#eaf1fc');
    document.documentElement.style.setProperty('--mat-sys-surface-container', '#d4e3f8');
    document.documentElement.style.setProperty('--mat-sys-surface-container-high', '#a8c8f0');
    document.documentElement.style.setProperty('--mat-sys-surface', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-on-primary', '#ffffff');
    document.documentElement.style.setProperty('--mat-sys-on-primary-container', '#001d35');
    document.documentElement.style.setProperty('--mat-sys-on-background', '#000000');
    document.documentElement.style.setProperty('--mat-sys-on-surface', '#000000');
    document.documentElement.style.setProperty('--mat-sys-on-surface-variant', '#1a1d24');
    document.documentElement.style.setProperty('--mat-sys-on-surface-container', '#000000');
    document.documentElement.style.setProperty('--mat-sys-primary', '#7db3e8');
  }

  isDarkTheme(): boolean {
    return this.isDark;
  }
}
