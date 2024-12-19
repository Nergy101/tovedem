import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-cookie-banner',
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss',
})
export class CookieBannerComponent {
  acceptCookies(): void {
    localStorage.setItem('cookieBannerAccepted', 'true');
  }

  rejectCookies(): void {
    localStorage.setItem('cookieBannerAccepted', 'false');
  }

  get cookieBannerAccepted(): string | null {
    return localStorage.getItem('cookieBannerAccepted');
  }
}
