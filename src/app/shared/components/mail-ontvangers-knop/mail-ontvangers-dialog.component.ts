import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClientResponseError } from 'pocketbase';
import { ToastrService } from 'ngx-toastr';
import {
  MailFormulier,
  MailOntvangers,
} from '../../../models/domain/mail-ontvangers.model';
import { ErrorService } from '../../services/error.service';
import { PocketbaseService } from '../../services/pocketbase.service';

export interface MailOntvangersDialogData {
  formulier: MailFormulier;
  titel: string;
}

@Component({
  selector: 'app-mail-ontvangers-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './mail-ontvangers-dialog.component.html',
  styleUrl: './mail-ontvangers-dialog.component.scss',
})
export class MailOntvangersDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MailOntvangersDialogComponent>);
  private client = inject(PocketbaseService);
  private toastr = inject(ToastrService);
  private errorService = inject(ErrorService);
  data: MailOntvangersDialogData = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  saving = signal(false);
  testing = signal(false);
  /** Het opgeslagen record; null als er nog niets is ingesteld. */
  bestaand = signal<MailOntvangers | null>(null);

  emails = new FormArray<FormControl<string>>([]);

  async ngOnInit(): Promise<void> {
    try {
      const record = await this.client.directClient
        .collection('mail_ontvangers')
        .getFirstListItem<MailOntvangers>(
          this.client.directClient.filter('formulier = {:formulier}', {
            formulier: this.data.formulier,
          })
        );
      this.bestaand.set(record);
      this.vulFormulier(record.emails ?? []);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.status === 404)) {
        this.toastr.error(
          this.errorService.getErrorMessage(error, 'Instellingen laden'),
          'Fout'
        );
      }
      this.vulFormulier([]);
    } finally {
      this.loading.set(false);
    }
  }

  private vulFormulier(emails: string[]): void {
    this.emails.clear();
    // Standaard twee velden tonen zodat er altijd een tweede adres ingevuld kan worden
    const waarden = emails.length >= 2 ? emails : [...emails, '', ''].slice(0, 2);
    waarden.forEach((email) => this.voegToe(email));
    this.emails.markAsPristine();
  }

  voegToe(email = ''): void {
    this.emails.push(
      new FormControl(email, {
        nonNullable: true,
        validators: [Validators.email],
      })
    );
    this.emails.markAsDirty();
  }

  verwijder(index: number): void {
    this.emails.removeAt(index);
    this.emails.markAsDirty();
  }

  ingevuldeEmails(): string[] {
    return this.emails.value
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email !== '');
  }

  kanOpslaan(): boolean {
    return (
      !this.saving() &&
      this.emails.valid &&
      this.emails.dirty &&
      this.ingevuldeEmails().length > 0
    );
  }

  async opslaan(): Promise<void> {
    const emails = [...new Set(this.ingevuldeEmails())];
    this.saving.set(true);
    try {
      const collection = this.client.directClient.collection('mail_ontvangers');
      const bestaand = this.bestaand();
      const record = bestaand
        ? await collection.update<MailOntvangers>(bestaand.id, { emails })
        : await collection.create<MailOntvangers>({
            formulier: this.data.formulier,
            emails,
          });
      this.bestaand.set(record);
      this.vulFormulier(record.emails);
      this.toastr.success(
        'Opgeslagen. Verstuur een testmail om te controleren of alles aankomt.',
        'Gelukt!'
      );
    } catch (error) {
      this.toastr.error(
        this.errorService.getErrorMessage(error, 'Instellingen opslaan'),
        'Fout'
      );
    } finally {
      this.saving.set(false);
    }
  }

  async verstuurTestmail(): Promise<void> {
    this.testing.set(true);
    try {
      const resultaat = await this.client.directClient.send<{
        ontvangers: string[];
        bron: 'ingesteld' | 'standaard';
      }>(`/api/tovedem/mail-ontvangers/${this.data.formulier}/test`, {
        method: 'POST',
      });
      this.toastr.success(
        `Testmail verstuurd naar ${resultaat.ontvangers.join(', ')}. Controleer of hij bij iedereen is aangekomen (ook in de spam).`,
        'Testmail verstuurd',
        { timeOut: 15000 }
      );
    } catch (error) {
      this.toastr.error(
        this.errorService.getErrorMessage(error, 'Testmail versturen'),
        'Fout'
      );
    } finally {
      this.testing.set(false);
    }
  }

  sluiten(): void {
    this.dialogRef.close();
  }
}
