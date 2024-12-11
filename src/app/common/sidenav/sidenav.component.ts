import { Component, WritableSignal, inject, signal } from '@angular/core';
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
@Component({
    selector: 'sidenav',
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
    styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  sideDrawerService = inject(SideDrawerService);
  authService = inject(AuthService);
  breakpointService = inject(BreakpointService);
  sintVerzoeken: WritableSignal<any[] | null> = signal(null);
  client = inject(PocketbaseService);

  toggle() {
    if (!this.breakpointService.isDesktopScreen()) {
      this.sideDrawerService.toggle();
    }
    //this.sintVerzoeken.set(
      //await this.client.getAll('sinterklaas_verzoeken', {
      //  sort: '-created',
      //})
    //);
  }

  close() {
    this.sideDrawerService.close();
  }

  navigate(url: string): void {
    window.open(url, '_blank');
  }
}
