import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Gebruiker } from '../../models/domain/gebruiker.model';
import { Rol } from '../../models/domain/rol.model';
import { ROUTE_ACCESS_CONFIG } from '../constants/route-access.config';
import { PocketbaseService } from './pocketbase.service';
import { SideDrawerService } from './side-drawer.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sideDrawerService = inject(SideDrawerService);
  pocketbaseService = inject(PocketbaseService);
  router = inject(Router);
  client = this.pocketbaseService.directClient; // Use directClient to bypass caching for auth-related operations

  public userRecord: WritableSignal<Gebruiker | null | undefined> = signal<
    Gebruiker | null | undefined
  >(undefined);

  public userData: Signal<Gebruiker | null> = computed(() => {
    return this.userRecord() ?? null;
  });

  get isGlobalAdmin(): boolean {
    return this.client?.authStore?.model?.collectionName === '_superusers';
  }

  public isLoggedIn: Signal<boolean> = computed(() => {
    const userRecord = this.userRecord();
    return !!userRecord;
  });

  constructor() {
    // check the localstorage for userData
    const existingUserData = this.client.authStore
      .record as unknown as Gebruiker;

    if (existingUserData) {
      if (this.client.authStore.isValid) {
        this.registerUser(existingUserData);
      } else {
        this.unregisterUser();
      }
    }

    // Automatically close side drawer for users without sidenav access
    effect(() => {
      const user = this.userData();
      if (user && !this.hasAccessToSidenav()) {
        this.sideDrawerService.close();
      }
    });

    // Auto-close sidenav on navigation if user has no access
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.hasAccessToSidenav()) {
          this.sideDrawerService.close();
        }
      });
  }

  /** True if user can see the Commissies section in the sidenav. */
  canAccessCommissiesSection = computed(
    () =>
      this.userHasAnyRole([
        'admin',
        'bestuur',
        'sint_commissie',
        'lees_commissie',
        'commissie',
        'beheer',
      ]) || this.isGlobalAdmin,
  );

  /** True if user can see Sinterklaas commissie link. */
  canAccessSinterklaasCommissie = computed(() => {
    this.userData();
    return this.canAccessRoute('commissie-sinterklaas');
  });

  /** True if user can see Lees commissie link. */
  canAccessLeesCommissie = computed(() => {
    this.userData();
    return this.canAccessRoute('lees-commissie');
  });

  /** True if user can see Nieuws commissie link. */
  canAccessNieuwsCommissie = computed(
    () => this.userHasAnyRole(['admin', 'bestuur']) || this.isGlobalAdmin,
  );

  /** True if user can see the Beheer section in the sidenav. */
  canAccessBeheerSection = computed(
    () => this.userHasAnyRole(['admin', 'bestuur']) || this.isGlobalAdmin,
  );

  /** True if user can see the Galerij section. */
  canAccessGalerij = computed(
    () =>
      this.userHasAnyRole(['admin', 'bestuur', 'commissie', 'lid']) ||
      this.isGlobalAdmin,
  );

  /**
   * True if the user may open the given route, using the same rules as loggedInGuard
   * (paths as in ROUTE_ACCESS_CONFIG, e.g. 'kassa' or 'productie-info/Cloos').
   */
  canAccessRoute(path: string): boolean {
    const entry = ROUTE_ACCESS_CONFIG.find((e) => e.path === path);
    if (!entry || entry.access === 'public') return true;
    if (this.isGlobalAdmin) return true;
    if (entry.access === 'logged-in') return this.isLoggedIn();
    return this.userHasAnyRole(entry.access);
  }

  /**
   * Check if the user has access to any sidenav content
   * This requires at least one recognized role (excluding bezoeker)
   */
  hasAccessToSidenav(): boolean {
    return (
      this.userHasAnyRole([
        'admin',
        'bestuur',
        'commissie',
        'lid',
        'beheer',
        'sint_commissie',
        'lees_commissie',
        'kassa',
      ]) || this.isGlobalAdmin
    );
  }

  isOnlyBezoeker(): boolean {
    const rollen = this.userData()?.expand?.rollen;
    if (!rollen || rollen.length === 0) {
      return false;
    }
    const mappedRollen = rollen.map((r: Rol) => r.rol) as string[];
    return (
      mappedRollen.length === 1 &&
      mappedRollen[0] === 'bezoeker' &&
      !this.userHasAllRoles(['lid'])
    );
  }

  userHasAllRoles(roles: string[]): boolean {
    if (this.userData()?.expand?.rollen) {
      const rollenVanGebruiker = this.userData()?.expand?.rollen?.map(
        (r: Rol) => r.rol,
      );

      return roles.every((role) => rollenVanGebruiker.includes(role));
    }
    return false;
  }

  userHasAnyRole(roles: string[]): boolean {
    if (this.userData()?.expand?.rollen) {
      const rollenVanGebruiker = this.userData()?.expand?.rollen?.map(
        (r: Rol) => r.rol,
      );

      return roles.some((role) => rollenVanGebruiker.includes(role));
    }
    return false;
  }

  registerUser(userRecord: Gebruiker): void {
    this.userRecord.set(userRecord);
  }

  unregisterUser(): void {
    this.sideDrawerService.close();
    this.userRecord.set(null);
    this.client.authStore.clear();
  }
}
