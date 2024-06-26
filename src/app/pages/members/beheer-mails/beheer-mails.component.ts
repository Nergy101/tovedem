import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MailEditDialogComponent } from './mail-edit-dialog/mail-edit-dialog.component';
import Mail from '../../../models/domain/mail.model';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-beheer-mails',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './beheer-mails.component.html',
  styleUrl: './beheer-mails.component.scss',
})
export class BeheerMailsComponent implements OnInit {
  loading = signal(false);
  mailTemplates: WritableSignal<Mail[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Mails');
  }

  async ngOnInit(): Promise<void> {
    this.mailTemplates.set(await this.client.getAll<Mail>('mails'));
  }

  async openEditDialog(mail: Mail) {
    const dialogRef = this.dialog.open(MailEditDialogComponent, {
      data: mail,
      hasBackdrop: true,
      minWidth: '70vw',
      minHeight: '70vh',
    });
    const edited: Mail = await lastValueFrom(dialogRef.afterClosed());

    if (!!edited) {
      await this.client.update<Mail>('mails', edited);
      this.toastr.success(`Mail '${edited.naam}' aangepast.`);
      await this.ngOnInit();
    }
  }
}
