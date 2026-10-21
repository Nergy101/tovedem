import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MailFormulier } from '../../../models/domain/mail-ontvangers.model';
import { AuthService } from '../../services/auth.service';
import {
  MailOntvangersDialogComponent,
  MailOntvangersDialogData,
} from './mail-ontvangers-dialog.component';

/** Instellingen-icoon waarmee admin/bestuur instelt naar wie de mails van een formulier gaan. */
@Component({
  selector: 'app-mail-ontvangers-knop',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (magInstellen()) {
      <button
        mat-icon-button
        type="button"
        aria-label="Mail instellingen"
        matTooltip="Instellen wie de mails ontvangt"
        (click)="openInstellingen()"
      >
        <mat-icon>settings</mat-icon>
      </button>
    }
  `,
})
export class MailOntvangersKnopComponent {
  formulier = input.required<MailFormulier>();
  titel = input.required<string>();

  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  magInstellen = computed(
    () =>
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin', 'bestuur'])
  );

  openInstellingen(): void {
    this.dialog.open<MailOntvangersDialogComponent, MailOntvangersDialogData>(
      MailOntvangersDialogComponent,
      {
        data: { formulier: this.formulier(), titel: this.titel() },
        width: '560px',
        maxWidth: '95vw',
      }
    );
  }
}
