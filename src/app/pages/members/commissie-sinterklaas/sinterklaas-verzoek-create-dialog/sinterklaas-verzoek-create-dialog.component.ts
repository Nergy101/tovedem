import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DATE_LOCALE,
  MatOption,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sinterklaas-verzoek-create-dialog',
  imports: [
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOption,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    FormsModule,
    MatButton,
    MatIconButton
],
  providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './sinterklaas-verzoek-create-dialog.component.html',
  styleUrl: './sinterklaas-verzoek-create-dialog.component.scss',
})
export class SinterklaasVerzoekCreateDialogComponent implements OnInit {
  client = inject(PocketbaseService);
  toastr = inject(ToastrService);
  loading = signal(false);

  dialogRef = inject(MatDialogRef<SinterklaasVerzoekCreateDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  name = signal<string | null>(null);
  email = signal<string | null>(null);
  subject = signal<string | null>(null);
  message = signal<string | null>(null);
  status = signal<string>('nieuw');
  plannedDate = signal<Date | null>(null);

  statussen = ['nieuw', 'inbehandeling', 'ingepland', 'afgerond'];

  get isUpdate(): boolean {
    return !!this.data?.existingVerzoek;
  }

  ngOnInit(): void {
    if (this.data?.existingVerzoek) {
      const existing = this.data.existingVerzoek;
      this.name.set(existing.name);
      this.email.set(existing.email);
      this.subject.set(existing.subject);
      this.message.set(existing.message);
      this.status.set(existing.status);
      if (existing.plannedDate) {
        // Try to parse the plannedDate string to a Date object
        // It might be in format "12-nov-2025 19:30" or "5 december 2024" or ISO format
        const parsedDate = this.parseDutchDate(existing.plannedDate);
        if (parsedDate) {
          this.plannedDate.set(parsedDate);
        }
      }
    }
  }

  private parseDutchDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Remove time part if present (e.g., "12-nov-2025 19:30" -> "12-nov-2025")
    const dateOnly = dateString.split(' ')[0];

    // Try ISO format first
    const isoDate = new Date(dateOnly);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try format like "12-nov-2025" or "12 nov 2025"
    const dateMatch = dateOnly.match(/(\d+)[-\s]+([a-z]+)[-\s]+(\d+)/i);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const monthName = dateMatch[2].toLowerCase();
      const year = parseInt(dateMatch[3], 10);

      const months: Record<string, number> = {
        jan: 0,
        januari: 0,
        feb: 1,
        februari: 1,
        mrt: 2,
        maart: 2,
        apr: 3,
        april: 3,
        mei: 4,
        jun: 5,
        juni: 5,
        jul: 6,
        juli: 6,
        aug: 7,
        augustus: 7,
        sep: 8,
        september: 8,
        okt: 9,
        oktober: 9,
        nov: 10,
        november: 10,
        dec: 11,
        december: 11,
      };

      if (months[monthName] !== undefined) {
        const date = new Date(year, months[monthName], day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try to parse Dutch format like "5 december 2024"
    const months: Record<string, number> = {
      januari: 0,
      februari: 1,
      maart: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      augustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      december: 11,
    };

    const parts = dateOnly.trim().toLowerCase().split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const monthName = parts[1];
      const year = parseInt(parts[2], 10);

      if (
        !isNaN(day) &&
        !isNaN(year) &&
        months[monthName] !== undefined
      ) {
        const date = new Date(year, months[monthName], day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // If all parsing fails, return null
    return null;
  }

  formIsValid(): boolean {
    return (
      !!this.name() &&
      this.name()!.trim() !== '' &&
      !!this.email() &&
      this.email()!.trim() !== '' &&
      !!this.subject() &&
      this.subject()!.trim() !== '' &&
      !!this.message() &&
      this.message()!.trim() !== ''
    );
  }

  async submit(): Promise<void> {
    if (!this.formIsValid()) return;

    this.loading.set(true);

    try {
      const verzoekData: any = {
        name: this.name()!,
        email: this.email()!,
        subject: this.subject()!,
        message: this.message()!,
        status: this.status(),
      };

      // Format plannedDate as "12-nov-2025" if it exists
      const plannedDateValue = this.plannedDate();
      if (plannedDateValue) {
        // Format as "12-nov-2025" (day-month-year with short month name)
        const day = plannedDateValue.getDate();
        const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        const month = monthNames[plannedDateValue.getMonth()];
        const year = plannedDateValue.getFullYear();
        verzoekData.plannedDate = `${day}-${month}-${year}`;
      } else {
        verzoekData.plannedDate = null;
      }

      if (this.isUpdate) {
        const updatedVerzoek = await this.client.update(
          'sinterklaas_verzoeken',
          {
            ...this.data.existingVerzoek,
            ...verzoekData,
          }
        );
        this.toastr.success('Sinterklaas verzoek is aangepast');
        this.dialogRef.close(updatedVerzoek);
      } else {
        const createdVerzoek = await this.client.create(
          'sinterklaas_verzoeken',
          verzoekData
        );
        this.toastr.success('Sinterklaas verzoek is aangemaakt');
        this.dialogRef.close(createdVerzoek);
      }
    } catch (error) {
      console.error(error);
      this.toastr.error(
        `Er is iets misgegaan bij het ${
          this.isUpdate ? 'aanpassen' : 'aanmaken'
        } van het verzoek`
      );
    } finally {
      this.loading.set(false);
    }
  }
}

