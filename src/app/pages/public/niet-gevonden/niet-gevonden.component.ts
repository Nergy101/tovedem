import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-niet-gevonden',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './niet-gevonden.component.html',
  styleUrl: './niet-gevonden.component.scss',
})
export class NietGevondenComponent {
  seoService = inject(SeoService);

  constructor() {
    this.seoService.update('Tovedem - Pagina niet gevonden');
  }
}
