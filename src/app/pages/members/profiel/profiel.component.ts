import { Component, OnInit, computed, inject } from '@angular/core';
import { AuthService } from '../../../shared/services/auth.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BreakpointService } from '../../../shared/services/breakpoint.service';

@Component({
    selector: 'app-profiel',
    imports: [
        CommonModule,
        MatExpansionModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatButtonModule,
        MatListModule,
        MatCardModule
    ],
    templateUrl: './profiel.component.html',
    styleUrl: './profiel.component.scss'
})
export class ProfielComponent implements OnInit {
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  sideDrawerService = inject(SideDrawerService);
  breakpointService = inject(BreakpointService);

  userRoles = computed(() => {
    const rollen = this.user()?.expand?.rollen;

    if (!!rollen && rollen?.length > 0) {
      const mappedRollen = rollen.map((r: any) => r.rol) as any[];
      return mappedRollen.join(', ');
    }
    return '';
  });

  user = this.authService?.userData;
  userRecord = this.authService?.userRecord;

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Profiel');
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  toggle() {
    this.sideDrawerService.toggle();
  }

  logout(): void {
    this.authService.unregisterUser();
    this.router.navigate(['/login']);
  }
}
