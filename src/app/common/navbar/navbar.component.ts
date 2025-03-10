import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { BreakpointService } from '../../shared/services/breakpoint.service';
import { SideDrawerService } from '../../shared/services/side-drawer.service';
import { ThemeService } from '../../shared/services/theme.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    NgOptimizedImage
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  breakpointService = inject(BreakpointService);
  sideDrawerService = inject(SideDrawerService);
  themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      const isDarkTheme = this.themeService.isDarkTheme$();
      if (isDarkTheme) {
        document.getElementsByTagName('nav')?.[0]?.classList.add('navbar-dark');
        document.getElementsByTagName('nav')?.[0]?.classList.add('bg-dark');
        document.getElementsByTagName('nav')?.[0]?.classList.remove('bg-light');
        document
          .getElementsByTagName('nav')?.[0]
          ?.classList.remove('navbar-light');
      } else {
        document
          .getElementsByTagName('nav')?.[0]
          ?.classList.add('navbar-light');
        document.getElementsByTagName('nav')?.[0]?.classList.add('bg-light');
        document.getElementsByTagName('nav')?.[0]?.classList.remove('bg-dark');
        document
          .getElementsByTagName('nav')?.[0]
          ?.classList.remove('navbar-dark');
      }
    });
  }

  get groepenClass(): string {
    return this.router.url.includes('groep') ? 'active' : '';
  }

  toggleSideDrawer(): void {
    if (this.sideDrawerService.isOpen()) {
      this.sideDrawerService.close();
    } else {
      this.sideDrawerService.open();
    }
  }
}
