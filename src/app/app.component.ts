import { Component, LOCALE_ID, ViewChild, effect, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AgendaComponent } from './pages/public/agenda/agenda.component';
import { NavbarComponent } from './common/navbar/navbar.component';
import { FooterComponent } from './common/footer/footer.component';
import { registerLocaleData } from '@angular/common';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import localeNL from '@angular/common/locales/nl';
import { AuthService } from './shared/services/auth.service';
import { SideDrawerService } from './shared/services/side-drawer.service';
import { MatListModule } from '@angular/material/list';
import { SidenavComponent } from './common/sidenav/sidenav.component';
import { BreakpointService } from './shared/services/breakpoint.service';
registerLocaleData(localeNL);

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'nl-NL' }],
  imports: [
    RouterOutlet,
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
    SidenavComponent,
  ],
})
export class AppComponent {
  authService = inject(AuthService);
  sideDrawerService = inject(SideDrawerService);
  breakpointService = inject(BreakpointService);

  @ViewChild(MatDrawer) drawer!: MatDrawer;

  constructor() {
    effect(() => {
      if (this.sideDrawerService.isOpen()) {
        if (this.authService.isLoggedIn()) {
          this.drawer.open();
          return;
        }
      }
      this.drawer.close();
    });
  }
}
