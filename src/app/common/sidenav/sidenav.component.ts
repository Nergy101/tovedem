import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AgendaComponent } from '../../pages/public/agenda/agenda.component';
import { AuthService } from '../../shared/services/auth.service';
import { BreakpointService } from '../../shared/services/breakpoint.service';
import { SideDrawerService } from '../../shared/services/side-drawer.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'sidenav',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatSidenavModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    AgendaComponent,
    NavbarComponent,
    FooterComponent,
    MatListModule,
    MatExpansionModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  sideDrawerService = inject(SideDrawerService);
  authService = inject(AuthService);
  breakpointService = inject(BreakpointService);

  toggle() {
    if (!this.breakpointService.isDesktopScreen()) {
      this.sideDrawerService.toggle();
    }
  }

  close() {
    this.sideDrawerService.close();
  }

  navigate(url: string): void {
    window.open(url, '_blank');
  }
}
