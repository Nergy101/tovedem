import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
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
    MatIconModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    DatePipe,
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
    {
      id: string;
      status: string;
      plannedDate: string;
      message: string;
      created: string;
      name: string;
      email: string;
      subject: string;
    }[] | null
  > = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);

  titleService = inject(Title);

  statussen = ['nieuw', 'inbehandeling', 'ingepland', 'afgerond'];
  statusColor: Record<string, string> = {
    nieuw: '#B80301',
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
}
