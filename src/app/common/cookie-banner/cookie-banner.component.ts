
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-cookie-banner',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss',
})
export class CookieBannerComponent {
  cookieBannerAccepted = signal<string | null>(localStorage.getItem('cookieBannerAccepted'));

  acceptCookies(): void {
    localStorage.setItem('cookieBannerAccepted', 'true');
    this.cookieBannerAccepted.set('true');
  }

  rejectCookies(): void {
    localStorage.setItem('cookieBannerAccepted', 'false');
    this.cookieBannerAccepted.set('false');
  }
}
