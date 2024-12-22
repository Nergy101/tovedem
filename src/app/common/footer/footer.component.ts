import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-footer',
    imports: [
        CommonModule,
        MatListModule,
        RouterModule,
        MatIconModule,
        MatTooltipModule,
        MatButtonModule
    ],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent {
  router = inject(Router);

  currentYear = new Date().getFullYear();

  async navigateTo(routeParts: string[]): Promise<void> {
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
