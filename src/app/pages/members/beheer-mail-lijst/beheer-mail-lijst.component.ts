import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom, debounceTime, tap } from 'rxjs';
import {
  MailLijstContact,
  MailLijstGroep,
} from '../../../models/domain/mail-lijst-contact.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-beheer-mail-lijst',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './beheer-mail-lijst.component.html',
  styleUrl: './beheer-mail-lijst.component.scss',
})
export class BeheerMailLijstComponent implements OnInit {
  loading = signal(false);
  contacten: WritableSignal<MailLijstContact[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  themeService = inject(ThemeService);
  titleService = inject(Title);

  searching = signal(false);
  searchTerm = signal('');
  groepFilter = signal<MailLijstGroep | 'alle'>('alle');
  searchTerm$ = toObservable(this.searchTerm);
  groepFilter$ = toObservable(this.groepFilter);

  readonly groepFilterOpties: { value: MailLijstGroep | 'alle'; label: string }[] = [
    { value: 'alle', label: 'Alle groepen' },
    { value: 'bezoeker', label: 'Bezoeker / Gast' },
    { value: 'tovedemlid', label: 'Tovedem lid' },
    { value: 'sponsor', label: 'Sponsor' },
  ];

  readonly groepLabels: Record<MailLijstGroep | 'alle', string> = {
    alle: 'Alle groepen',
    bezoeker: 'Bezoeker / Gast',
    tovedemlid: 'Tovedem lid',
    sponsor: 'Sponsor',
  };

  readonly groepKleuren: Record<MailLijstGroep, string> = {
    bezoeker: '#28668F',
    tovedemlid: '#338450',
    sponsor: '#DFA801',
  };

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Mail lijst');

    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async () => {
        await this.loadContacten();
        this.searching.set(false);
      });

    this.groepFilter$
      .pipe(takeUntilDestroyed())
      .subscribe(async () => {
        await this.loadContacten();
      });
  }

  async ngOnInit(): Promise<void> {
    await this.loadContacten();
  }

  private async loadContacten(): Promise<void> {
    try {
      const filters: string[] = ['actief = true'];
      const search = this.searchTerm();
      const groep = this.groepFilter();

      if (search) {
        filters.push(
          this.client.directClient.filter(
            '(voornaam ~ {:s} || achternaam ~ {:s} || email ~ {:s})',
            { s: search }
          )
        );
      }
      if (groep !== 'alle') {
        filters.push(
          this.client.directClient.filter('groep = {:groep}', { groep })
        );
      }

      const result = await this.client.directClient
        .collection('mail_lijst')
        .getFullList({
          sort: '-created',
          filter: filters.join(' && '),
        });
      this.contacten.set(result as unknown as MailLijstContact[]);
    } catch (error) {
      console.error('Error loading mail lijst:', error);
      this.toastr.error('Fout bij het laden van de mail lijst');
    }
  }

  async verwijder(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Contact verwijderen',
        message: 'Weet je zeker dat je dit contact wilt verwijderen van de mail lijst?',
      },
    });
    const result = await lastValueFrom(dialogRef.afterClosed());
    if (!result) return;

    this.loading.set(true);
    try {
      await this.client.directClient.collection('mail_lijst').delete(id);
      this.contacten.update((c) => c!.filter((x) => x.id !== id));
      this.toastr.success('Contact verwijderd.');
    } catch {
      this.toastr.error('Fout bij het verwijderen van het contact');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActief(contact: MailLijstContact): Promise<void> {
    try {
      await this.client.directClient
        .collection('mail_lijst')
        .update(contact.id, { actief: !contact.actief });
      this.contacten.update((c) =>
        c!.map((x) =>
          x.id === contact.id ? { ...x, actief: !x.actief } : x
        )
      );
    } catch {
      this.toastr.error('Fout bij het bijwerken van het contact');
    }
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  aantalPerGroep(groep: MailLijstGroep): number {
    return (this.contacten() ?? []).filter((c) => c.groep === groep).length;
  }
}
