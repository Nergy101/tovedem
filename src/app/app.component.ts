import { registerLocaleData } from '@angular/common';
import localeNL from '@angular/common/locales/nl';
import {
  Component,
  LOCALE_ID,
  ViewChild,
  effect,
  inject,
  OnInit,
  Injector,
  afterNextRender,
} from '@angular/core';
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
import { FocusManagementService } from './shared/services/focus-management.service';
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
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  sideDrawerService = inject(SideDrawerService);
  breakpointService = inject(BreakpointService);
  themeService = inject(ThemeService);
  focusManagementService = inject(FocusManagementService);
  injector = inject(Injector);

  @ViewChild(MatDrawer) drawer?: MatDrawer;

  constructor() {
    // side drawer
    effect(async () => {
      if (this.authService.isLoggedIn()) {
        if (this.sideDrawerService.isOpen()) {
          // allow to render the drawer and open it
          afterNextRender(
            () => {
              this.drawer?.open();
            },
            { injector: this.injector }
          );

          return;
        }
      }
      localStorage.setItem('sideDrawerOpen', 'false');
      // allow to render the drawer and open it
      afterNextRender(
        () => {
          this.drawer?.close();
        },
        { injector: this.injector }
      );
    });
  }

  ngOnInit(): void {
    // Theme is now managed by ThemeService
  }

  skipToMainContent(): void {
    this.focusManagementService.skipToMainContent();
  }

  skipToNavigation(): void {
    this.focusManagementService.skipToNavigation();
  }

  skipToFooter(): void {
    this.focusManagementService.skipToFooter();
  }
}
