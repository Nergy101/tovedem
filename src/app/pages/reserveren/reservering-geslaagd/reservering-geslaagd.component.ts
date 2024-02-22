import {
  Component,
  OnInit,
  WritableSignal,
  signal,
  inject,
  Input,
  input,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { NavButtonComponent } from '../../../shared/components/nav-button/nav-button.component';

@Component({
  selector: 'app-reservering-geslaagd',
  standalone: true,
  templateUrl: './reservering-geslaagd.component.html',
  styleUrl: './reservering-geslaagd.component.scss',
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    NavButtonComponent,
  ],
})
export class ReserveringGeslaagdComponent implements OnInit {
  url = 'https://tovedem.pockethost.io/';
  client = inject(PocketbaseService).client;
  router = inject(Router);

  content: WritableSignal<string | null> = signal(null);

  @Input({ required: true, alias: 'voorstelling' })
  voorstellingId!: string;

  @Input({ required: true, alias: 'reservering' })
  reserveringsId!: string;

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('sinterklaas').getList(1, 1))
      .items[0];
    this.content.set((record as any).tekst_1);
  }
}
