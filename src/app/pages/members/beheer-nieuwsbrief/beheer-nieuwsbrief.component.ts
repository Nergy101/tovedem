import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import {
  BLOK_ICONS,
  BLOK_LABELS,
  NieuwsbriefBlok,
  NieuwsbriefBlokType,
} from '../../../models/domain/nieuwsbrief-blok.model';
import {
  Nieuwsbrief,
  NieuwsbriefDoelgroep,
  NieuwsbriefStatus,
} from '../../../models/domain/nieuwsbrief.model';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-beheer-nieuwsbrief',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './beheer-nieuwsbrief.component.html',
  styleUrl: './beheer-nieuwsbrief.component.scss',
})
export class BeheerNieuwsbriefComponent implements OnInit {
  id = input<string>();

  client = inject(PocketbaseService);
  dialog = inject(MatDialog);
  router = inject(Router);
  toastr = inject(ToastrService);
  titleService = inject(Title);

  loading = signal(false);
  saving = signal(false);
  verzendend = signal(false);
  view = signal<'editor' | 'preview'>('editor');

  titel = signal('');
  doelgroep = signal<NieuwsbriefDoelgroep>('iedereen');
  status = signal<NieuwsbriefStatus>('concept');

  blokken = signal<NieuwsbriefBlok[]>([]);
  actieveBlokIndex = signal<number | null>(null);

  readonly blokTypes: NieuwsbriefBlokType[] = [
    'koptekst',
    'alinea',
    'afbeelding',
    'evenement',
    'scheidingslijn',
    'knop',
  ];
  readonly blokLabels = BLOK_LABELS;
  readonly blokIcons = BLOK_ICONS;

  readonly doelgroepOpties: { value: NieuwsbriefDoelgroep; label: string }[] = [
    { value: 'iedereen', label: 'Iedereen' },
    { value: 'bezoeker', label: 'Bezoekers / Gasten' },
    { value: 'tovedemlid', label: 'Tovedem leden' },
    { value: 'sponsor', label: 'Sponsors' },
  ];

  previewHtml = computed<string>(() => this.genereerEmailHtml());

  get isNieuw(): boolean {
    return this.id() === 'nieuw';
  }

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Tovedem - Nieuwsbrief opstellen');
    if (!this.isNieuw) {
      await this.laadNieuwsbrief();
    }
  }

  private async laadNieuwsbrief(): Promise<void> {
    this.loading.set(true);
    try {
      const record = await this.client.directClient
        .collection('nieuwsbrieven')
        .getOne(this.id()!);
      const nw = record as unknown as Nieuwsbrief;
      this.titel.set(nw.titel);
      this.doelgroep.set(nw.doelgroep);
      this.status.set(nw.status);
      this.blokken.set(
        Array.isArray(nw.blokken) ? nw.blokken : []
      );
    } catch {
      this.toastr.error('Nieuwsbrief kon niet geladen worden');
      this.router.navigate(['/beheer-mails']);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Block operations ──────────────────────────────────────────────────────

  voegBlokToe(type: NieuwsbriefBlokType): void {
    const blok: NieuwsbriefBlok = { id: crypto.randomUUID(), type };
    this.blokken.update((b) => [...b, blok]);
    this.actieveBlokIndex.set(this.blokken().length - 1);
  }

  verwijderBlok(index: number): void {
    this.blokken.update((b) => b.filter((_, i) => i !== index));
    if (this.actieveBlokIndex() === index) {
      this.actieveBlokIndex.set(null);
    }
  }

  verplaatsOmhoog(index: number): void {
    if (index === 0) return;
    this.blokken.update((b) => {
      const arr = [...b];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
    this.actieveBlokIndex.set(index - 1);
  }

  verplaatsOmlaag(index: number): void {
    if (index === this.blokken().length - 1) return;
    this.blokken.update((b) => {
      const arr = [...b];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
    this.actieveBlokIndex.set(index + 1);
  }

  updateBlok(index: number, veld: keyof NieuwsbriefBlok, waarde: string): void {
    this.blokken.update((b) =>
      b.map((blok, i) => (i === index ? { ...blok, [veld]: waarde } : blok))
    );
  }

  toggleBlok(index: number): void {
    this.actieveBlokIndex.set(
      this.actieveBlokIndex() === index ? null : index
    );
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  async opslaan(nieuweStatus?: NieuwsbriefStatus): Promise<string | null> {
    this.saving.set(true);
    const data = {
      titel: this.titel(),
      doelgroep: this.doelgroep(),
      status: nieuweStatus ?? this.status(),
      blokken: this.blokken(),
    };
    try {
      if (this.isNieuw) {
        const record = await this.client.directClient
          .collection('nieuwsbrieven')
          .create(data);
        this.toastr.success('Nieuwsbrief opgeslagen als concept');
        return record.id;
      } else {
        await this.client.directClient
          .collection('nieuwsbrieven')
          .update(this.id()!, data);
        if (nieuweStatus) this.status.set(nieuweStatus);
        this.toastr.success('Nieuwsbrief opgeslagen');
        return this.id()!;
      }
    } catch {
      this.toastr.error('Fout bij het opslaan');
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  async versturen(): Promise<void> {
    const label = this.doelgroepOpties.find(
      (o) => o.value === this.doelgroep()
    )?.label ?? this.doelgroep();

    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Nieuwsbrief versturen',
        message: `Weet je zeker dat je deze nieuwsbrief wilt versturen naar <strong>${label}</strong>?`,
        confirmLabel: 'Verstuur',
        confirmColor: 'primary',
      },
    });
    const confirmed = await lastValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    // Opslaan met status 'verzonden'
    const savedId = await this.opslaan('verzonden');
    if (!savedId) return;

    this.verzendend.set(true);
    try {
      await this.client.directClient.send('/nieuwsbrief/verstuur', {
        method: 'POST',
        body: {
          nieuwsbriefId: savedId,
          doelgroep: this.doelgroep(),
          html: this.genereerEmailHtml(),
          onderwerp: this.titel(),
        },
      });
      this.toastr.success('Nieuwsbrief verstuurd!');
      this.router.navigate(['/beheer-mails']);
    } catch {
      this.toastr.error('Fout bij het versturen van de nieuwsbrief.');
    } finally {
      this.verzendend.set(false);
    }
  }

  async terug(): Promise<void> {
    this.router.navigate(['/beheer-mails']);
  }

  // ── HTML generation ──────────────────────────────────────────────────────

  genereerEmailHtml(): string {
    const blocksHtml = this.blokken().map((b) => this.renderBlok(b)).join('\n');
    return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${this.titel() || 'Nieuwsbrief'}</title>
</head>
<body style="margin:0;padding:20px 0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
${blocksHtml}
    <div style="background:#f9f9f9;padding:16px 24px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;">
      <p style="margin:0;">© Tovedem &nbsp;|&nbsp; <a href="#" style="color:#7db3e8;text-decoration:none;">Uitschrijven</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  private renderBlok(b: NieuwsbriefBlok): string {
    switch (b.type) {
      case 'koptekst':
        return `    <div style="background:#7db3e8;color:#fff;padding:28px 24px;text-align:center;">
      <h1 style="margin:0;font-size:26px;font-weight:700;">${b.titel || 'Koptekst'}</h1>
      ${b.ondertitel ? `<p style="margin:6px 0 0;font-size:15px;opacity:0.9;">${b.ondertitel}</p>` : ''}
    </div>`;

      case 'alinea':
        return `    <div style="padding:20px 24px;">
      <p style="margin:0;line-height:1.7;color:#333;font-size:15px;">${(b.tekst || '').replace(/\n/g, '<br>')}</p>
    </div>`;

      case 'afbeelding':
        return b.afbeelding_url
          ? `    <div style="padding:16px 24px;text-align:center;">
      <img src="${b.afbeelding_url}" alt="${b.afbeelding_alt || ''}" style="max-width:100%;border-radius:6px;display:block;margin:0 auto;">
      ${b.onderschrift ? `<p style="margin:8px 0 0;font-size:13px;color:#888;">${b.onderschrift}</p>` : ''}
    </div>`
          : '';

      case 'evenement':
        return `    <div style="margin:12px 24px;padding:16px 20px;border-left:4px solid #7db3e8;background:#f0f6ff;border-radius:0 6px 6px 0;">
      <h3 style="margin:0 0 10px;color:#1a5fa8;font-size:17px;">${b.event_titel || 'Evenement'}</h3>
      ${b.event_datum ? `<p style="margin:4px 0;color:#555;font-size:14px;">📅 ${b.event_datum}</p>` : ''}
      ${b.event_locatie ? `<p style="margin:4px 0;color:#555;font-size:14px;">📍 ${b.event_locatie}</p>` : ''}
      ${b.event_prijs ? `<p style="margin:4px 0;color:#555;font-size:14px;">💶 ${b.event_prijs}</p>` : ''}
      ${b.event_link ? `<a href="${b.event_link}" style="display:inline-block;margin-top:10px;background:#7db3e8;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;">Meer info →</a>` : ''}
    </div>`;

      case 'scheidingslijn':
        return `    <div style="padding:4px 24px;"><hr style="border:none;border-top:1px solid #e8e8e8;margin:0;"></div>`;

      case 'knop':
        return b.knop_url && b.knop_label
          ? `    <div style="padding:16px 24px;text-align:center;">
      <a href="${b.knop_url}" style="display:inline-block;background:#7db3e8;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:700;">${b.knop_label}</a>
    </div>`
          : '';

      default:
        return '';
    }
  }
}
