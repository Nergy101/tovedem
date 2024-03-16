import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../shared/services/auth.service';
import Gebruiker from '../../../models/domain/gebruiker.model';

@Component({
  selector: 'app-beheer-leden',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './beheer-leden.component.html',
  styleUrl: './beheer-leden.component.scss',
})
export class BeheerLedenComponent implements OnInit {
  loading = signal(false);

  gebruikers: WritableSignal<Gebruiker[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);

  async ngOnInit(): Promise<void> {
    this.gebruikers.set(
      await this.client.getAll<Gebruiker>('users', {
        expand: 'rollen,groep,speler',
      })
    );
  }

  isHuidigeGebruiker(gebruikerId: string) {
    return gebruikerId == this.authService.userData()?.id;
  }
}
