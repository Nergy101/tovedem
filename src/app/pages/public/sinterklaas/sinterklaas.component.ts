import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-sinterklaas',
  standalone: true,
  imports: [MatProgressSpinnerModule,
    MatFormFieldModule,
    MatIconModule,
    CommonModule,
    RouterModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatCheckboxModule,
    
  ],
  templateUrl: './sinterklaas.component.html',
  styleUrl: './sinterklaas.component.scss',
})
export class SinterklaasComponent implements OnInit {
  client = inject(PocketbaseService).client;

  content: WritableSignal<string | null> = signal(null);

  titleService = inject(Title);
  name: string | null = null;
  email: string | null = null;
  subject: string | null = null;
  message: string | null = null;
  router = inject(Router);
  verstuurContactMail() {}

  constructor() {
    this.titleService.setTitle('Tovedem - Sinterklaas');
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('sinterklaas').getList(1, 1))
      .items[0];
    this.content.set((record as any).tekst_1);
  }
}
