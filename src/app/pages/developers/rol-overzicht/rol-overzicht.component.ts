import { Component, inject, OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ROUTE_ACCESS_CONFIG, type RouteAccessEntry } from '../../../shared/constants/route-access.config';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { Rol } from '../../../models/domain/rol.model';

interface GebruikerWithExpand extends Gebruiker {
  expand?: {
    rollen?: Rol[];
    groep?: { naam?: string };
    speler?: { naam?: string };
  };
}

interface SuperuserRecord {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-rol-overzicht',
  imports: [
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './rol-overzicht.component.html',
  styleUrl: './rol-overzicht.component.scss',
})
export class RolOverzichtComponent implements OnInit {
  private titleService = inject(Title);
  private client = inject(PocketbaseService);

  readonly routeConfig = ROUTE_ACCESS_CONFIG;

  users = signal<GebruikerWithExpand[]>([]);
  superusers = signal<SuperuserRecord[] | null>(null);
  superusersError = signal<string | null>(null);
  loadingUsers = signal(true);
  loadingSuperusers = signal(true);

  constructor() {
    this.titleService.setTitle('Tovedem - Developers - Rol-overzicht');
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadUsers(), this.loadSuperusers()]);
  }

  private async loadUsers(): Promise<void> {
    this.loadingUsers.set(true);
    try {
      const list = (await this.client.directClient
        .collection('users')
        .getFullList({
          expand: 'rollen,groep,speler',
        })) as unknown as GebruikerWithExpand[];
      this.users.set(list);
    } catch (error) {
      console.error('Error loading users:', error);
      this.users.set([]);
    } finally {
      this.loadingUsers.set(false);
    }
  }

  private async loadSuperusers(): Promise<void> {
    this.loadingSuperusers.set(true);
    this.superusersError.set(null);
    try {
      const list = (await this.client.directClient
        .collection('_superusers')
        .getFullList()) as unknown as SuperuserRecord[];
      this.superusers.set(list);
    } catch {
      this.superusers.set(null);
      this.superusersError.set(
        'Superusers kunnen alleen via PocketBase Admin worden beheerd.'
      );
    } finally {
      this.loadingSuperusers.set(false);
    }
  }

  formatAccess(entry: RouteAccessEntry): string {
    if (entry.access === 'public') return 'Publiek';
    if (entry.access === 'logged-in') return 'Ingelogd';
    return (entry.access as string[]).join(', ');
  }

  getRoleNames(gebruiker: GebruikerWithExpand): string[] {
    const rollen = gebruiker.expand?.rollen;
    if (!rollen?.length) return [];
    return rollen.map((r) => r.rol);
  }
}
