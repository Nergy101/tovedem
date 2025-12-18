import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { BreakpointService } from '../../../shared/services/breakpoint.service';
import { Rol } from '../../../models/domain/rol.model';
import { Reservering } from '../../../models/domain/reservering.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';

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
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatPaginatorModule,
    NgOptimizedImage,
  ],
  templateUrl: './profiel.component.html',
  styleUrl: './profiel.component.scss',
})
export class ProfielComponent implements OnInit {
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  sideDrawerService = inject(SideDrawerService);
  breakpointService = inject(BreakpointService);
  pocketbaseService = inject(PocketbaseService);

  userRoles = computed(() => {
    const rollen = this.user()?.expand?.rollen;

    if (!!rollen && rollen?.length > 0) {
      const mappedRollen = rollen.map((r: Rol) => r.rol) as string[];
      return mappedRollen.join(', ');
    }
    return 'geen';
  });

  isOnlyBezoeker = computed(() => {
    const rollen = this.user()?.expand?.rollen;
    if (!rollen || rollen.length === 0) {
      return false;
    }
    const mappedRollen = rollen.map((r: Rol) => r.rol) as string[];
    return (
      mappedRollen.length === 1 &&
      mappedRollen[0] === 'bezoeker' &&
      !this.authService.userHasAllRoles(['lid'])
    );
  });

  // Role-based access checks for profile cards
  canAccessProductieInfo = computed(() => {
    return (
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin', 'bestuur', 'lid'])
    );
  });

  canAccessKassa = computed(() => {
    return (
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin', 'bestuur', 'kassa'])
    );
  });

  canAccessAlgemeneInformatie = computed(() => {
    return (
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin', 'bestuur', 'lid'])
    );
  });

  user = this.authService?.userData;
  userRecord = this.authService?.userRecord;

  reserveringen: WritableSignal<Reservering[] | null> = signal(null);
  loadingReserveringen = signal(false);
  pageIndex = signal(0);
  pageSize = signal(4);

  paginatedReserveringen = computed(() => {
    const allReserveringen = this.reserveringen();
    if (!allReserveringen || allReserveringen.length === 0) {
      return [];
    }
    const startIndex = this.pageIndex() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return allReserveringen.slice(startIndex, endIndex);
  });

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Profiel');
  }

  async ngOnInit(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    // Close side drawer if user is only bezoeker
    if (this.isOnlyBezoeker()) {
      this.sideDrawerService.close();
    }

    // Load reserveringen for bezoekers or superusers with matching email
    const userEmail =
      this.user()?.email || this.authService.client?.authStore?.model?.email;
    if (
      (this.isOnlyBezoeker() || this.authService.isGlobalAdmin) &&
      userEmail
    ) {
      await this.loadReserveringen();
    }
  }

  async loadReserveringen(): Promise<void> {
    // Get email from user record or from superuser authStore
    const userEmail =
      this.user()?.email || this.authService.client?.authStore?.model?.email;

    if (!userEmail) {
      return;
    }

    this.loadingReserveringen.set(true);
    try {
      const reserveringen = await this.pocketbaseService.directClient
        .collection('reserveringen')
        .getFullList({
          filter: this.pocketbaseService.directClient.filter(
            'email = {:email}',
            {
              email: userEmail,
            }
          ),
          expand: 'voorstelling',
          sort: '-created',
        });

      this.reserveringen.set(reserveringen as unknown as Reservering[]);
    } catch (error) {
      console.error('Error loading reserveringen:', error);
      this.reserveringen.set([]);
    } finally {
      this.loadingReserveringen.set(false);
    }
  }

  navigateTo(url: string): void {
    this.router.navigate([url]);
  }

  openSideDrawer(): void {
    this.sideDrawerService.open();
  }

  closeSideDrawer(): void {
    this.sideDrawerService.close();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  logout(): void {
    this.authService.unregisterUser();
    this.router.navigate(['/login']);
  }
}
