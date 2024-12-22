import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isDarkTheme$ = signal(false);

  constructor() {
    this.isDarkTheme$.set(this.isDarkTheme());

    const theme = localStorage.getItem('theme');
    if (theme) {
      this.isDarkTheme$.set(theme === 'dark');
    }

    effect(() => {
      const isDarkTheme = this.isDarkTheme$();

      if (!isDarkTheme) {
        document.getElementsByTagName('html')[0].classList.remove('dark-theme');
      } else {
        document.getElementsByTagName('html')[0].classList.add('dark-theme');
      }

      localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    });
  }

  isDarkTheme(): boolean {
    return document
      .getElementsByTagName('html')[0]
      .classList.contains('dark-theme');
  }

  toggleTheme(): void {
    this.isDarkTheme$.set(!this.isDarkTheme());
  }
}
