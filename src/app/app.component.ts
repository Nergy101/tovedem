import { registerLocaleData } from '@angular/common';
import localeNL from '@angular/common/locales/nl';
import { Component, LOCALE_ID, ViewChild, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CookieBannerComponent } from './common/cookie-banner/cookie-banner.component';
import { FooterComponent } from './common/footer/footer.component';
import { NavbarComponent } from './common/navbar/navbar.component';
import { SidenavComponent } from './common/sidenav/sidenav.component';
import { AuthService } from './shared/services/auth.service';
import { BreakpointService } from './shared/services/breakpoint.service';
import { SideDrawerService } from './shared/services/side-drawer.service';
import { ThemeService } from './shared/services/theme.service';
registerLocaleData(localeNL);

@Component({
  selector: 'app-root',
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
    NavbarComponent,
    FooterComponent,
    MatListModule,
    SidenavComponent,
    CookieBannerComponent,
  ],
})
export class AppComponent {
  authService = inject(AuthService);
  sideDrawerService = inject(SideDrawerService);
  breakpointService = inject(BreakpointService);
  themeService = inject(ThemeService);

  @ViewChild(MatDrawer) drawer?: MatDrawer;

  constructor() {
    // side drawer
    effect(async () => {
      if (this.authService.isLoggedIn()) {
        if (this.sideDrawerService.isOpen()) {
          // allow to render the drawer and open it
          setTimeout(() => {
            this.drawer?.open();
          }, 100);

          return;
        }
      }
      localStorage.setItem('sideDrawerOpen', 'false');
      // allow to render the drawer and open it
      setTimeout(() => {
        this.drawer?.close();
      }, 100);
    });

    // theme
    effect(() => {
      const isDarkTheme = this.themeService.isDarkTheme$();
      if (isDarkTheme) {
        document
          .getElementsByTagName('mat-drawer')?.[0]
          ?.classList.add('bg-dark');
        document
          .getElementsByTagName('mat-drawer')?.[0]
          ?.classList.remove('bg-light');
      } else {
        document
          .getElementsByTagName('mat-drawer')?.[0]
          ?.classList.add('bg-light');
        document
          .getElementsByTagName('mat-drawer')?.[0]
          ?.classList.remove('bg-dark');
      }
    });
  }
}
