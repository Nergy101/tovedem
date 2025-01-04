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
      console.log(isDarkTheme);

      if (!isDarkTheme) {
        // document.getElementsByTagName('html')[0].classList.remove('dark-theme');
        document.body.classList.remove('darkMode');
      } else {
        // document.getElementsByTagName('html')[0].classList.add('dark-theme');
        document.body.classList.add('darkMode');
      }

      localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    });
  }

  isDarkTheme(): boolean {
    return document.body.classList.contains('darkMode');
  }

  toggleTheme(): void {
    this.isDarkTheme$.set(!this.isDarkTheme());
  }
}
