import { Component, WritableSignal, inject, signal, viewChild } from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
//import { VoorstellingCreateEditDialogComponent } from './voorstelling-create-edit-dialog/voorstelling-create-edit-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDivider } from '@angular/material/divider';


@Component({
  selector: 'commissie-sinterklaas',
  standalone: true,
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
    MatDivider,
  ],providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './commissie-sinterklaas.component.html',
  styleUrl: './commissie-sinterklaas.component.scss',
})
export class CommissieSinterklaasComponent {
  loading = signal(false);

  items: WritableSignal<any[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);

  titleService = inject(Title);

  

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

  async delete({ id }: any) {
    this.loading.set(true);

    if (await this.client.delete('sinterklaas_verzoeken', id)) {
      this.items.update((x) => x!.filter((y: any) => y.id != id));
    }

    this.loading.set(false);
  }
  
  async selectNieuw(item: any){
    this.loading.set(true);
    item.status = "nieuw";
    const updated = await this.client.update('sinterklaas_verzoeken', item);
  }
  async selectInbehandeling(item: any){
    this.loading.set(true);
    item.status = "inbehandeling";
    const updated = await this.client.update('sinterklaas_verzoeken', item);
  }
  async selectIngepland(item: any){
    this.loading.set(true);
    item.status = "ingepland";
    const updated = await this.client.update('sinterklaas_verzoeken', item);
  }
  async selectAfgerond(item: any){
    this.loading.set(true);
    item.status = "afgerond";
    const updated = await this.client.update('sinterklaas_verzoeken', item);

  }
}
