
import {
  Component,
  OnInit,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { Mail } from '../../../models/domain/mail.model';
import { Reservering } from '../../../models/domain/reservering.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { InformatieDialogComponent } from '../../../shared/components/informatie-dialog/informatie-dialog.component';
import { AmsterdamDatePipe } from '../../../shared/pipes/amsterdam-date.pipe';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { MailEditDialogComponent } from './mail-edit-dialog/mail-edit-dialog.component';

interface MailFoutInfo {
  naam: string;
  email: string;
}


@Component({
  selector: 'app-beheer-mails',
  imports: [
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatSelectModule,
    AmsterdamDatePipe,
  ],
  templateUrl: './beheer-mails.component.html',
  styleUrl: './beheer-mails.component.scss',
})
export class BeheerMailsComponent implements OnInit {
  loading = signal(false);
  mailTemplates: WritableSignal<Mail[] | null> = signal(null);

  // Mails opnieuw versturen
  voorstellingen = signal<Voorstelling[]>([]);
  selectedVoorstelling = signal<Voorstelling | null>(null);
  reserveringenVanVoorstelling = signal<Reservering[]>([]);
  loadingReserveringen = signal(false);
  selectedIds = signal<Set<string>>(new Set());
  verzendendMails = signal(false);

  aantalGeselecteerd = computed(() => this.selectedIds().size);
  alleGeselecteerd = computed(() => {
    const reserveringen = this.reserveringenVanVoorstelling();
    return reserveringen.length > 0 && this.selectedIds().size === reserveringen.length;
  });
  indeterminate = computed(() => {
    const size = this.selectedIds().size;
    const total = this.reserveringenVanVoorstelling().length;
    return size > 0 && size < total;
  });

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  titleService = inject(Title);
  themeService = inject(ThemeService);
  statussen = ['concept', 'inprogress', 'done', 'verified'];
  statusColor: Record<string, string> = {
    concept: '#B80301',
    inprogress: '#28668F',
    done: '#DFA801',
    verified: '#338450',
  };

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Mails');

    effect(() => {
      const voorstelling = this.selectedVoorstelling();
      if (!voorstelling) {
        this.reserveringenVanVoorstelling.set([]);
        this.selectedIds.set(new Set());
        return;
      }

      this.loadingReserveringen.set(true);
      this.selectedIds.set(new Set());
      this.client.directClient
        .collection('reserveringen')
        .getFullList({
          filter: this.client.directClient.filter(
            'voorstelling.id = {:voorstellingId}',
            { voorstellingId: voorstelling.id },
          ),
          sort: '-created',
        })
        .then((result) => {
          this.reserveringenVanVoorstelling.set(result as unknown as Reservering[]);
          this.loadingReserveringen.set(false);
        })
        .catch(() => {
          this.loadingReserveringen.set(false);
        });
    });
  }

  async ngOnInit(): Promise<void> {
    const [templates, voorstellingen] = await Promise.all([
      this.client.directClient.collection('mails').getFullList(),
      this.client.directClient
        .collection('voorstellingen')
        .getFullList({ sort: '-datum_tijd_1' }),
    ]);
    this.mailTemplates.set(templates as unknown as Mail[]);
    this.voorstellingen.set(voorstellingen as unknown as Voorstelling[]);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelectie(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  toggleAllesSelecteren(): void {
    if (this.alleGeselecteerd() || this.indeterminate()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(
        new Set(this.reserveringenVanVoorstelling().map((r) => r.id)),
      );
    }
  }

  async stuurMailsOpnieuw(): Promise<void> {
    const geselecteerd = this.reserveringenVanVoorstelling().filter((r) =>
      this.selectedIds().has(r.id),
    );
    const totaal = geselecteerd.length;

    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Mails opnieuw versturen',
        message: `Weet je het zeker? Er worden <strong>${totaal}</strong> mail(s) opnieuw verstuurd.`,
        confirmLabel: 'Verstuur',
        confirmColor: 'primary',
      },
    });

    const confirmed = await lastValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    this.verzendendMails.set(true);
    const mislukt: MailFoutInfo[] = [];
    let geslaagd = 0;

    const chunkSize = 5;

    for (let i = 0; i < geselecteerd.length; i += chunkSize) {
      const chunk = geselecteerd.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (reservering) => {
          try {
            await this.client.directClient.send('/reserveringen/resend-mail', {
              method: 'POST',
              body: { reserveringId: reservering.id },
            });
            geslaagd++;
          } catch (err) {
            console.error('Resend mail mislukt voor', reservering.email, err);
            mislukt.push({
              naam: `${reservering.voornaam} ${reservering.achternaam}`,
              email: reservering.email,
            });
          }
        }),
      );
    }

    this.verzendendMails.set(false);
    this.selectedIds.set(new Set());

    if (mislukt.length === 0) {
      this.toastr.success(`Alle ${geslaagd} mail(s) zijn opnieuw verstuurd!`);
    } else {
      this.toastr.warning(
        `${geslaagd} van ${totaal} mail(s) verstuurd. ${mislukt.length} mislukt.`,
      );
      const lijstHtml = mislukt
        .map((m) => `<li><strong>${m.naam}</strong> &ndash; ${m.email}</li>`)
        .join('');
      this.dialog.open(InformatieDialogComponent, {
        data: {
          title: `${mislukt.length} mail(s) mislukt`,
          content: `<p>De volgende mails konden niet verstuurd worden:</p><ul>${lijstHtml}</ul>`,
        },
      });
    }
  }


  async openEditDialog(mail: Mail): Promise<void> {
    const dialogRef = this.dialog.open(MailEditDialogComponent, {
      data: mail,
      hasBackdrop: true,
      minWidth: '70vw',
      minHeight: '70vh',
    });
    const edited: Mail = await lastValueFrom(dialogRef.afterClosed());

    if (edited) {
      await this.client.update<Mail>('mails', edited);
      this.toastr.success(`Mail '${edited.naam}' aangepast.`);
      await this.ngOnInit();
    }
  }

  async updateMailStatus(
    item: Mail,
    status: 'concept' | 'inprogress' | 'done' | 'verified'
  ): Promise<void> {
    this.loading.set(true);
    item.status = status;
    await this.client.update('mails', item);
    this.loading.set(false);
  }

  getLabelBackgroundColor(status: string): string {
    return this.statusColor[status] || '#000000';
  }

  getMailStatus(status: string): string {
    if(status == 'inprogress') {
      return 'In Progress';
    }
    return status;
  }

  getPrimaryTintColor(): string {
    // Primary blue (#7db3e8) with 0.3 opacity for consistency
    return 'rgba(125, 179, 232, 0.3)';
  }
}
