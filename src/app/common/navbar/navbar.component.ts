import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { SideDrawerService } from '../../shared/services/side-drawer.service';
import { BreakpointService } from '../../shared/services/breakpoint.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  breakpointService = inject(BreakpointService);
  sideDrawerService = inject(SideDrawerService);

  get groepenClass() {
    return this.router.url.includes('groep') ? 'active' : '';
  }

  toggle() {
    this.sideDrawerService.toggle();
  }
}
