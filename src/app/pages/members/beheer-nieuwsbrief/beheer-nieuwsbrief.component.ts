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
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  NieuwsbriefUitlijning,
  uitlijningVan,
} from '../../../models/domain/nieuwsbrief-blok.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import {
  Nieuwsbrief,
  NieuwsbriefDoelgroep,
  NieuwsbriefStatus,
} from '../../../models/domain/nieuwsbrief.model';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatDialog } from '@angular/material/dialog';
import { SkeletonGroupComponent } from '../../../shared/components/skeleton/skeleton-group.component';
import { DateTimeService } from '../../../shared/services/datetime.service';
import {
  GalerijAfbeeldingDialogComponent,
  GekozenGalerijAfbeelding,
} from './galerij-afbeelding-dialog/galerij-afbeelding-dialog.component';
import { SITE_URL, genereerNieuwsbriefHtml } from './nieuwsbrief-html';

/** Maximale breedte van een afbeelding in de mail (x2 voor scherpe schermen). */
const AFBEELDING_THUMB = '1200x0';

@Component({
  selector: 'app-beheer-nieuwsbrief',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    DragDropModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    SkeletonGroupComponent,
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
  dateTimeService = inject(DateTimeService);

  loading = signal(false);
  saving = signal(false);
  verzendend = signal(false);
  view = signal<'editor' | 'preview'>('editor');

  titel = signal('');
  doelgroep = signal<NieuwsbriefDoelgroep>('iedereen');
  status = signal<NieuwsbriefStatus>('concept');

  blokken = signal<NieuwsbriefBlok[]>([]);
  actieveBlokId = signal<string | null>(null);
  /** Blok waarvoor nu een afbeelding geupload wordt. */
  uploadendBlokId = signal<string | null>(null);

  voorstellingen = signal<Voorstelling[]>([]);

  readonly blokTypes: NieuwsbriefBlokType[] = [
    'koptekst',
    'alinea',
    'afbeelding',
    'evenement',
    'voorstelling',
    'scheidingslijn',
    'knop',
  ];
  readonly blokLabels = BLOK_LABELS;
  readonly blokIcons = BLOK_ICONS;
  readonly uitlijningVan = uitlijningVan;
  readonly uitlijningOpties: { waarde: NieuwsbriefUitlijning; icoon: string; label: string }[] = [
    { waarde: 'links', icoon: 'format_align_left', label: 'Links uitlijnen' },
    { waarde: 'midden', icoon: 'format_align_center', label: 'Centreren' },
    { waarde: 'rechts', icoon: 'format_align_right', label: 'Rechts uitlijnen' },
  ];

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
    void this.laadVoorstellingen();
    if (!this.isNieuw) {
      await this.laadNieuwsbrief();
    }
  }

  private async laadVoorstellingen(): Promise<void> {
    try {
      this.voorstellingen.set(
        await this.client.directClient
          .collection('voorstellingen')
          .getFullList<Voorstelling>({
            sort: '-datum_tijd_1',
            filter: 'gearchiveerd != true',
          })
      );
    } catch (error) {
      console.error('Error loading voorstellingen:', error);
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
    if (type === 'voorstelling') {
      blok.toon_ondertitel = true;
      blok.toon_omschrijving = false;
      blok.toon_prijs = true;
      blok.toon_regie = false;
    }
    this.blokken.update((b) => [...b, blok]);
    this.actieveBlokId.set(blok.id);
  }

  verwijderBlok(index: number): void {
    const blok = this.blokken()[index];
    this.blokken.update((b) => b.filter((_, i) => i !== index));
    if (blok && this.actieveBlokId() === blok.id) {
      this.actieveBlokId.set(null);
    }
  }

  verplaatsOmhoog(index: number): void {
    this.verplaats(index, index - 1);
  }

  verplaatsOmlaag(index: number): void {
    this.verplaats(index, index + 1);
  }

  /** Slepen en neerzetten in de lijst met blokken. */
  blokNeergezet(event: CdkDragDrop<NieuwsbriefBlok[]>): void {
    this.verplaats(event.previousIndex, event.currentIndex);
  }

  private verplaats(van: number, naar: number): void {
    if (van === naar || naar < 0 || naar >= this.blokken().length) return;
    this.blokken.update((b) => {
      const arr = [...b];
      moveItemInArray(arr, van, naar);
      return arr;
    });
  }

  updateBlok<K extends keyof NieuwsbriefBlok>(
    index: number,
    veld: K,
    waarde: NieuwsbriefBlok[K]
  ): void {
    this.blokken.update((b) =>
      b.map((blok, i) => (i === index ? { ...blok, [veld]: waarde } : blok))
    );
  }

  toggleBlok(blok: NieuwsbriefBlok): void {
    this.actieveBlokId.set(this.actieveBlokId() === blok.id ? null : blok.id);
  }

  blokSamenvatting(blok: NieuwsbriefBlok): string {
    return (
      blok.titel ||
      blok.tekst ||
      blok.event_titel ||
      blok.voorstelling_titel ||
      blok.knop_label ||
      blok.afbeelding_alt ||
      ''
    );
  }

  // ── Voorstelling ─────────────────────────────────────────────────────────

  kiesVoorstelling(index: number, voorstellingId: string): void {
    const voorstelling = this.voorstellingen().find((v) => v.id === voorstellingId);
    if (!voorstelling) return;

    const datums = [voorstelling.datum_tijd_1, voorstelling.datum_tijd_2]
      .filter((datum): datum is string => !!datum)
      .map(
        (datum) =>
          `${this.dateTimeService.formatFullDateWithWeekday(datum)} · ${this.dateTimeService.formatTime(datum)} uur`
      );

    this.blokken.update((b) =>
      b.map((blok, i) =>
        i === index
          ? {
              ...blok,
              voorstelling_id: voorstelling.id,
              voorstelling_titel: voorstelling.titel,
              voorstelling_ondertitel: voorstelling.ondertitel ?? '',
              voorstelling_omschrijving: voorstelling.omschrijving ?? '',
              voorstelling_regie: voorstelling.regie ?? '',
              voorstelling_prijs: voorstelling.prijs_per_kaartje ?? null,
              voorstelling_afbeelding_url: voorstelling.afbeelding
                ? this.client.directClient.files.getURL(voorstelling, voorstelling.afbeelding, {
                    thumb: AFBEELDING_THUMB,
                  })
                : '',
              voorstelling_datums: datums,
              voorstelling_reserveer_url: `${SITE_URL}/reserveren?voorstellingId=${voorstelling.id}`,
            }
          : blok
      )
    );
  }

  // ── Afbeeldingen ─────────────────────────────────────────────────────────

  async kiesUitGalerij(index: number): Promise<void> {
    const dialogRef = this.dialog.open<
      GalerijAfbeeldingDialogComponent,
      void,
      GekozenGalerijAfbeelding
    >(GalerijAfbeeldingDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });
    const gekozen = await lastValueFrom(dialogRef.afterClosed());
    if (!gekozen) return;

    const blok = this.blokken()[index];
    this.uploadendBlokId.set(blok.id);
    try {
      // Galerijfoto's zijn afgeschermd: ontvangers van de mail kunnen ze niet openen.
      // Daarom wordt een (verkleinde) kopie openbaar opgeslagen in `afbeeldingen`.
      const token = await this.client.getFileToken();
      const response = await fetch(
        this.client.directClient.files.getURL(gekozen.folder, gekozen.bestand, {
          token,
          thumb: AFBEELDING_THUMB,
        })
      );
      if (!response.ok) throw new Error(`Download mislukt (${response.status})`);
      const url = await this.zetAfbeeldingOnline(await response.blob());
      this.updateBlokById(blok.id, {
        afbeelding_url: url,
        afbeelding_alt: blok.afbeelding_alt || gekozen.folder.naam,
      });
      this.toastr.success('Foto uit de galerij toegevoegd');
    } catch (error) {
      console.error('Error copying galerij foto:', error);
      this.toastr.error('De foto kon niet voor de nieuwsbrief opgeslagen worden');
    } finally {
      this.uploadendBlokId.set(null);
    }
  }

  async uploadAfbeelding(index: number, event: Event): Promise<void> {
    const invoer = event.target as HTMLInputElement;
    const bestand = invoer.files?.[0];
    invoer.value = '';
    if (!bestand) return;

    const blok = this.blokken()[index];
    this.uploadendBlokId.set(blok.id);
    try {
      const url = await this.zetAfbeeldingOnline(bestand);
      this.updateBlokById(blok.id, { afbeelding_url: url });
      this.toastr.success('Afbeelding geüpload');
    } catch (error) {
      console.error('Error uploading afbeelding:', error);
      this.toastr.error('Uploaden mislukt. Is de afbeelding kleiner dan 5 MB?');
    } finally {
      this.uploadendBlokId.set(null);
    }
  }

  /** Slaat een afbeelding openbaar op en geeft de URL terug die in de mail gebruikt kan worden. */
  private async zetAfbeeldingOnline(afbeelding: Blob): Promise<string> {
    const extensie =
      afbeelding.type === 'image/png' ? 'png' : afbeelding.type === 'image/webp' ? 'webp' : 'jpg';
    // Korte bestandsnaam: PocketBase voegt zelf een unieke code toe
    const formData = new FormData();
    formData.append('bestand', afbeelding, `nieuwsbrief.${extensie}`);
    const record = await this.client.directClient.collection('afbeeldingen').create(formData);
    return this.client.directClient.files.getURL(record, record['bestand']);
  }

  private updateBlokById(id: string, wijzigingen: Partial<NieuwsbriefBlok>): void {
    this.blokken.update((b) =>
      b.map((blok) => (blok.id === id ? { ...blok, ...wijzigingen } : blok))
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
    return genereerNieuwsbriefHtml(this.blokken(), {
      titel: this.titel(),
      datumLabel: new Intl.DateTimeFormat('nl-NL', {
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    });
  }
}
