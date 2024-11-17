import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    MatListModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {

  router = inject(Router);

  async navigateTo(routeParts: string[]) {
    await this.router.navigate(routeParts);
    location.reload()
  }

  navigateToFaceBook(): void {
    window.open('https://www.facebook.com/tovedem', '_blank');
  }

  navigateToInstagram(): void {
    window.open('https://www.instagram.com/tovedem.demeern/', '_blank');
  }
}
