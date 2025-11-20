import { Component, inject, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenu } from '@angular/material/menu';
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

  @ViewChild('groepenMenu') groepenMenu?: MatMenu;

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

  /**
   * Handle keyboard navigation in the navbar
   */
  @HostListener('keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle Escape key to close menus
    if (event.key === 'Escape') {
      const activeMenu = document.querySelector('.mat-mdc-menu-panel.mat-mdc-menu-panel--open');
      if (activeMenu) {
        event.preventDefault();
        event.stopPropagation();
        // Close menu by clicking outside or pressing Escape
        document.body.click();
      }
    }

    // Handle arrow keys in menu navigation
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const menuItems = Array.from(
        document.querySelectorAll<HTMLElement>('.mat-mdc-menu-panel button[role="menuitem"]')
      );
      
      if (menuItems.length > 0) {
        const currentIndex = menuItems.findIndex(item => item === document.activeElement);
        let nextIndex: number;

        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        }

        event.preventDefault();
        menuItems[nextIndex]?.focus();
      }
    }
  }
}
