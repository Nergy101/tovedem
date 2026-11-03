import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { AuthService } from '../../../shared/services/auth.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';

import { CommonModule } from '@angular/common';
import { AmsterdamDatePipe } from '../../../shared/pipes/amsterdam-date.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Rol } from '../../../models/domain/rol.model';
import { Nieuws } from '../../../models/domain/nieuws.model';
import { Reservering } from '../../../models/domain/reservering.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { DateTimeService } from '../../../shared/services/datetime.service';
import { RondleidingService } from '../../../shared/services/rondleiding.service';
import { SkeletonGroupComponent } from '../../../shared/components/skeleton/skeleton-group.component';
import {
  WELKOM_RONDLEIDING_ID,
  getWelkomRondleidingStappen,
} from './welkom-rondleiding';

interface Snelkoppeling {
  titel: string;
  omschrijving: string;
  icon: string;
  /** Pad zoals in ROUTE_ACCESS_CONFIG; bepaalt ook of de tegel getoond wordt. */
  route: string;
}

const SNELKOPPELINGEN: Snelkoppeling[] = [
  {
    titel: 'Tovedem',
    omschrijving: 'Productie-informatie',
    icon: 'diversity_1',
    route: 'productie-info/Tovedem',
  },
  {
    titel: 'Cloos',
    omschrijving: 'Productie-informatie',
    icon: 'diversity_2',
    route: 'productie-info/Cloos',
  },
  {
    titel: "Mejoto's",
    omschrijving: 'Productie-informatie',
    icon: 'diversity_3',
    route: 'productie-info/Mejotos',
  },
  {
    titel: 'Galerij',
    omschrijving: "Foto's van voorstellingen",
    icon: 'photo_library',
    route: 'galerij',
  },
  {
    titel: 'De Kassa',
    omschrijving: 'Bezoekers ontvangen op de speeldag',
    icon: 'point_of_sale',
    route: 'kassa',
  },
  {
    titel: 'Reserveringen',
    omschrijving: 'Overzicht per voorstelling',
    icon: 'payments',
    route: 'beheer-reserveringen',
  },
  {
    titel: 'Printen',
    omschrijving: '"Gereserveerd voor"-kaartjes',
    icon: 'print',
    route: 'printen',
  },
  {
    titel: 'Algemene informatie',
    omschrijving: 'Over de vereniging en de website',
    icon: 'info',
    route: 'algemene-informatie',
  },
];

const AANTAL_NIEUWSBERICHTEN = 3;
/** Duur van de open/dicht-animatie van het zijmenu en de panelen. */
const ZIJMENU_ANIMATIE_MS = 400;

@Component({
  selector: 'app-profiel',
  imports: [
    CommonModule,
    RouterLink,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatListModule,
    MatCardModule,
    MatPaginatorModule,
    MatTooltipModule,
    AmsterdamDatePipe,
    SkeletonGroupComponent,
  ],
  templateUrl: './profiel.component.html',
  styleUrl: './profiel.component.scss',
})
export class ProfielComponent implements OnInit {
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  sideDrawerService = inject(SideDrawerService);
  pocketbaseService = inject(PocketbaseService);
  dateTimeService = inject(DateTimeService);
  rondleidingService = inject(RondleidingService);
  titleService = inject(Title);

  user = this.authService?.userData;
  userRecord = this.authService?.userRecord;

  rollen = computed<string[]>(() => {
    if (this.authService.isGlobalAdmin) return ['global admin'];
    const rollen = this.user()?.expand?.rollen as Rol[] | undefined;
    return rollen?.map((r) => r.rol) ?? [];
  });

  userRoles = computed(() =>
    this.rollen().length > 0 ? this.rollen().join(', ') : 'geen'
  );

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

  // Reserveringen worden alleen opgehaald voor bezoekers en global admins
  toonReserveringen = computed(
    () => this.isOnlyBezoeker() || this.authService.isGlobalAdmin
  );

  voornaam = computed(() => {
    const user = this.user();
    const naam = user?.name?.trim();
    if (naam) return naam.split(' ')[0];
    return user?.username || user?.email || '';
  });

  begroeting = computed(() => {
    const uur = new Date().getHours();
    if (uur < 6) return 'Goedenacht';
    if (uur < 12) return 'Goedemorgen';
    if (uur < 18) return 'Goedemiddag';
    return 'Goedenavond';
  });

  vandaag = new Date().toISOString();

  avatarUrl = computed(
    () =>
      'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
      encodeURIComponent(this.user()?.name ?? '') +
      '&backgroundColor=f1f4dc,f88c49,ffd5dc,ffdfbf,d1d4f9,c0aede&backgroundType=gradientLinear&shapeColor=69d2e7,f1f4dc,f88c49'
  );

  snelkoppelingen = computed(() => {
    // Lees userData zodat de tegels bijwerken als de gebruiker (her)laadt
    this.user();
    return SNELKOPPELINGEN.filter((s) =>
      this.authService.canAccessRoute(s.route)
    );
  });

  nieuws = signal<Nieuws[]>([]);
  loadingNieuws = signal(true);
  uitgeklaptNieuws = signal<Set<string>>(new Set());

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

  /** Stand van het zijmenu vóór de rondleiding, om die daarna te herstellen. */
  private zijmenuWasOpen = false;

  constructor() {
    this.titleService.setTitle('Tovedem - Welkom');
    inject(DestroyRef).onDestroy(() => this.rondleidingService.stop());
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

    const userEmail =
      this.user()?.email || this.authService.client?.authStore?.model?.email;

    await Promise.all([
      this.loadNieuws(),
      this.toonReserveringen() && userEmail
        ? this.loadReserveringen()
        : Promise.resolve(),
    ]);

    // Wacht één tick zodat de geladen secties gerenderd zijn
    setTimeout(() => {
      if (!this.rondleidingService.isGezien(WELKOM_RONDLEIDING_ID)) {
        this.startRondleiding();
      }
    });
  }

  async loadNieuws(): Promise<void> {
    this.loadingNieuws.set(true);
    try {
      const nieuws = await this.pocketbaseService.getAll<Nieuws>('nieuws', {
        sort: '-publishDate',
      });
      this.nieuws.set(
        nieuws
          .filter((item) => this.isGepubliceerd(item))
          .slice(0, AANTAL_NIEUWSBERICHTEN)
      );
    } catch (error) {
      console.error('Error loading nieuws:', error);
      this.nieuws.set([]);
    } finally {
      this.loadingNieuws.set(false);
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

  /** Zelfde regel als op de homepage: gepubliceerd en nog niet gearchiveerd. */
  isGepubliceerd(nieuws: Nieuws): boolean {
    return (
      this.dateTimeService.isPast(nieuws.publishDate) &&
      this.dateTimeService.isFuture(nieuws.archiveDate)
    );
  }

  getNieuwsAfbeelding(nieuws: Nieuws): string {
    if (!nieuws.afbeelding) return '/assets/Place-Holder-Image.jpg';
    return this.pocketbaseService.directClient.files.getURL(
      nieuws,
      nieuws.afbeelding,
      { thumb: '0x400' }
    );
  }

  getNieuwsSamenvatting(nieuws: Nieuws): string {
    const tekst =
      new DOMParser().parseFromString(nieuws.inhoud ?? '', 'text/html').body
        .textContent ?? '';
    const compact = tekst.replace(/\s+/g, ' ').trim();
    return compact.length > 180 ? compact.slice(0, 180).trimEnd() + '…' : compact;
  }

  isNieuwsUitgeklapt(nieuws: Nieuws): boolean {
    return this.uitgeklaptNieuws().has(nieuws.id);
  }

  toggleNieuws(nieuws: Nieuws): void {
    this.uitgeklaptNieuws.update((ids) => {
      const nieuw = new Set(ids);
      if (nieuw.has(nieuws.id)) {
        nieuw.delete(nieuws.id);
      } else {
        nieuw.add(nieuws.id);
      }
      return nieuw;
    });
  }

  startRondleiding(): void {
    this.zijmenuWasOpen = this.sideDrawerService.isOpen();
    // Alle zijmenu-secties uitklappen zodat elke knop aangewezen kan worden
    this.sideDrawerService.rondleidingActief.set(true);

    this.rondleidingService.start(
      WELKOM_RONDLEIDING_ID,
      getWelkomRondleidingStappen(this.authService, {
        open: () => this.zetZijmenu(true),
        herstel: () => this.zetZijmenu(this.zijmenuWasOpen),
      }),
      {
        onAfgesloten: () => {
          this.sideDrawerService.rondleidingActief.set(false);
          void this.zetZijmenu(this.zijmenuWasOpen);
        },
      }
    );
  }

  private async zetZijmenu(open: boolean): Promise<void> {
    if (!this.authService.hasAccessToSidenav()) return;
    if (this.sideDrawerService.isOpen() === open) return;

    if (open) {
      this.sideDrawerService.open();
    } else {
      this.sideDrawerService.close();
    }
    await new Promise((resolve) => setTimeout(resolve, ZIJMENU_ANIMATIE_MS));
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
