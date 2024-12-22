import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { BreakpointService } from '../../shared/services/breakpoint.service';
import { PocketbaseService } from '../../shared/services/pocketbase.service';
import { SideDrawerService } from '../../shared/services/side-drawer.service';
import { ThemeService } from '../../shared/services/theme.service';
@Component({
  selector: 'app-sidenav',
  imports: [
    RouterModule,
    MatButtonModule,
    MatSidenavModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatListModule,
    MatExpansionModule,
    MatBadgeModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  sideDrawerService = inject(SideDrawerService);
  authService = inject(AuthService);
  breakpointService = inject(BreakpointService);
  client = inject(PocketbaseService);

  async toggle(): Promise<void> {
    if (!this.breakpointService.isDesktopScreen()) {
      this.sideDrawerService.toggle();
    }
  }

  close(): void {
    this.sideDrawerService.close();
  }

  navigate(url: string): void {
    window.open(url, '_blank');
  }
}
