import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
    selector: 'app-nav-button',
    imports: [MatButtonModule],
    templateUrl: './nav-button.component.html',
    styleUrl: './nav-button.component.scss'
})
export class NavButtonComponent {
  queryParams = input<Record<string, string>>({});
  navigationParts = input.required<string[]>();

  router = inject(Router);

  navigate(): void {
    this.router.navigate(this.navigationParts(), {
      queryParams: this.queryParams(),
    });
  }
}
