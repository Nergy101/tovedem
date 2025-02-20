import { Component, inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { Mail} from '../../../../models/domain/mail.model';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-mail-edit-dialog',
    imports: [
        MatDialogModule,
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        MatListModule,
        MatIconModule
    ],
    templateUrl: './mail-edit-dialog.component.html',
    styleUrl: './mail-edit-dialog.component.scss'
})
export class MailEditDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<MailEditDialogComponent>);
  dialogData: Mail = inject(MAT_DIALOG_DATA);

  mail!: Mail;

  get placeholders(): string {
    const mailInhoud = this.mail.inhoud!;
    const regex = /{([^}]+)}/g
    const placeholders = mailInhoud.match(regex) || []
    const distinctPlaceholders = placeholders.filter((value, index, self) => self.indexOf(value) === index)
    return distinctPlaceholders.join(', ')
  }


  ngOnInit(): void {
    this.mail = this.dialogData;
  }

  downloadVoorbeeld(): void {
    const mailInhoud = this.mail.inhoud!;

    // download mailInhoud as html file for viewing separately
    const blob = new Blob([mailInhoud], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voorbeeld.html';
    a.click();
  }

  return(): void {
    this.dialogRef.close(this.mail);
  }
}
