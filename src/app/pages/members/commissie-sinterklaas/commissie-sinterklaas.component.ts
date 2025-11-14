import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { lastValueFrom } from 'rxjs';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';

@Component({
  selector: 'app-commissie-sinterklaas',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    NgxMaterialTimepickerModule,
    MatTooltipModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './commissie-sinterklaas.component.html',
  styleUrl: './commissie-sinterklaas.component.scss',
})
export class CommissieSinterklaasComponent implements OnInit {
  loading = signal(false);

  items: WritableSignal<
    | {
        id: string;
        status: string;
        plannedDate: string;
        message: string;
        created: string;
        name: string;
        email: string;
        subject: string;
      }[]
    | null
  > = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);

  titleService = inject(Title);

  statussen = ['nieuw', 'inbehandeling', 'ingepland', 'afgerond'];
  statusColor: Record<string, string> = {
    nieuw: '#7db3e8', // Primary blue color
    inbehandeling: '#28668F',
    ingepland: '#DFA801',
    afgerond: '#338450',
  };

  constructor() {
    this.titleService.setTitle('Tovedem - Commissie - Sinterklaas');
  }

  async ngOnInit(): Promise<void> {
    this.items.set(
      await this.client.getAll('sinterklaas_verzoeken', {
        sort: '-created',
      })
    );
  }

  async delete(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Sinterklaas verzoek verwijderen',
        message: 'Weet je zeker dat je het verzoek wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;
    this.loading.set(true);

    if (await this.client.delete('sinterklaas_verzoeken', id)) {
      this.items.update((x) => x!.filter((y: { id: string }) => y.id != id));
    }

    this.loading.set(false);
  }

  async updateStatus(
    item: { id: string; status: string },
    newStatus: string
  ): Promise<void> {
    this.loading.set(true);
    item.status = newStatus;
    await this.client.update('sinterklaas_verzoeken', item);
    this.loading.set(false);
  }

  getLabelBackgroundColor(status: string): string {
    return this.statusColor[status] || '#000000';
  }

  getLabelBackgroundTint(status: string): string {
    const color = this.statusColor[status] || '#000000';
    // Convert hex to RGB and add subtle tint
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Use higher opacity for nieuw and inbehandeling to make them more obvious
    // Higher for lighter colors (yellow) to maintain visibility
    let opacity: number;
    if (status === 'nieuw' || status === 'inbehandeling') {
      opacity = 0.3; // More obvious for these statuses
    } else if (status === 'ingepland') {
      opacity = 0.2;
    } else {
      opacity = 0.15;
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  getLabelBorderWidth(status: string): string {
    // Make nieuw and inbehandeling borders thicker for more prominence
    if (status === 'nieuw' || status === 'inbehandeling') {
      return '6px';
    }
    return '4px';
  }
}
