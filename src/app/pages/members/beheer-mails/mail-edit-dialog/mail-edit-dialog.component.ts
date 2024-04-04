import { Component, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import Mail from '../../../../models/domain/mail.model';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-mail-edit-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './mail-edit-dialog.component.html',
  styleUrl: './mail-edit-dialog.component.scss',
})
export class MailEditDialogComponent {
  dialogRef = inject(MatDialogRef<MailEditDialogComponent>);
  dialogData: Mail = inject(MAT_DIALOG_DATA);

  mail!: Mail;

  ngOnInit(): void {
    this.mail = this.dialogData;
  }

  return(): void {
    this.dialogRef.close(this.mail);
  }
}
