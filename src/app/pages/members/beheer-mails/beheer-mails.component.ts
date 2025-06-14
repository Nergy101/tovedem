import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
  AfterViewChecked,
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
import { lastValueFrom } from 'rxjs';
import { Mail } from '../../../models/domain/mail.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MailEditDialogComponent } from './mail-edit-dialog/mail-edit-dialog.component';
import { ThemeService } from '../../../shared/services/theme.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-beheer-mails',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './beheer-mails.component.html',
  styleUrl: './beheer-mails.component.scss',
})
export class BeheerMailsComponent implements OnInit, AfterViewChecked {
  loading = signal(false);
  mailTemplates: WritableSignal<Mail[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  titleService = inject(Title);
  themeService = inject(ThemeService);
  statussen = ['concept', 'inprogress', 'done', 'verified'];
  statusColor: Record<string, string> = {
    concept: '#B80301',
    inprogress: '#28668F',
    done: '#DFA801',
    verified: '#338450',
  };

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Mails');
  }

  async ngOnInit(): Promise<void> {
    this.mailTemplates.set(await this.client.getAll<Mail>('mails'));
  }

  ngAfterViewChecked(): void {
    const isDarkTheme = this.themeService.isDarkTheme$();

    const tables = document.getElementsByTagName('table');

    if (isDarkTheme) {
      tables[0]?.classList.add('table-dark');
    } else {
      tables[0]?.classList.remove('table-dark');
    }
  }

  async openEditDialog(mail: Mail): Promise<void> {
    const dialogRef = this.dialog.open(MailEditDialogComponent, {
      data: mail,
      hasBackdrop: true,
      minWidth: '70vw',
      minHeight: '70vh',
    });
    const edited: Mail = await lastValueFrom(dialogRef.afterClosed());

    if (edited) {
      await this.client.update<Mail>('mails', edited);
      this.toastr.success(`Mail '${edited.naam}' aangepast.`);
      await this.ngOnInit();
    }
  }

  async updateMailStatus(
    item: Mail,
    status: 'concept' | 'inprogress' | 'done' | 'verified'
  ): Promise<void> {
    this.loading.set(true);
    item.status = status;
    await this.client.update('mails', item);
    this.loading.set(false);
  }

  getLabelBackgroundColor(status: string): string {
    return this.statusColor[status] || '#000000';
  }

  getMailStatus(status: string): string {
    if(status == 'inprogress') {
      return 'In Progress';
    }
    return status;
  }
}
