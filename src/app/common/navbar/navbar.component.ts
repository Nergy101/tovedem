import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { BreakpointService } from '../../shared/services/breakpoint.service';
import { SideDrawerService } from '../../shared/services/side-drawer.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  breakpointService = inject(BreakpointService);
  sideDrawerService = inject(SideDrawerService);
  themeService = inject(ThemeService);

  ngOnInit(): void {
    // Theme is now managed by ThemeService
  }

  get groepenClass(): string {
    return this.router.url.includes('groep') ? 'active' : '';
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSideDrawer(): void {
    if (this.sideDrawerService.isOpen()) {
      this.sideDrawerService.close();
    } else {
      this.sideDrawerService.open();
    }
  }
}
