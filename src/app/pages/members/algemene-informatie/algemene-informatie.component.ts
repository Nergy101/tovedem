import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-algemene-informatie',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterModule,
  ],
  templateUrl: './algemene-informatie.component.html',
  styleUrl: './algemene-informatie.component.scss',
})
export class AlgemeneInformatieComponent {
  private titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Algemene Informatie');
  }
}
