import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { SponsorLogo } from '../../models/domain/sponsor-logo.model';
import { PocketbaseService } from '../../shared/services/pocketbase.service';
import { Environment } from '../../../environment';

@Component({
  selector: 'app-footer',
  imports: [
    CommonModule,
    MatListModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    NgOptimizedImage,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  router = inject(Router);
  client = inject(PocketbaseService);
  environment = inject(Environment);

  currentYear = new Date().getFullYear();
  sponsorLogos: WritableSignal<SponsorLogo[]> = signal([]);

  async navigateTo(routeParts: string[]): Promise<void> {
    await this.router.navigate(routeParts);
    location.reload();
  }

  navigateToFaceBook(): void {
    window.open('https://www.facebook.com/tovedem', '_blank');
  }

  navigateToInstagram(): void {
    window.open('https://www.instagram.com/tovedem.demeern/', '_blank');
  }

  async ngOnInit(): Promise<void> {
    const logos = await this.client.getAll<SponsorLogo>('sponsoren_logos');
    this.sponsorLogos.set(logos);
  }

  getImageUrl(sponsorLogo: SponsorLogo): string {
    if (!sponsorLogo.logo) {
      return 'assets/Place-Holder-Image.jpg';
    }
    return `${this.environment.pocketbase.baseUrl}/api/files/sponsoren_logos/${sponsorLogo.id}/${sponsorLogo.logo}`;
  }
}
