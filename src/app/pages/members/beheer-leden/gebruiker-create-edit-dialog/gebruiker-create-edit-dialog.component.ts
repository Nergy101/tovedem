import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import Gebruiker from '../../../../models/domain/gebruiker.model';
import Speler from '../../../../models/domain/speler.model';
import Groep from '../../../../models/domain/groep.model';
import Rol from '../../../../models/domain/rol.model';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { QuillModule } from 'ngx-quill';
import { TovedemFilePickerComponent } from '../../../../shared/components/tovedem-file-picker/tovedem-file-picker.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-gebruiker-create-edit-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    QuillModule,
    NgxMaterialTimepickerModule,
    TovedemFilePickerComponent,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'nl-NL' }],
  templateUrl: './gebruiker-create-edit-dialog.component.html',
  styleUrl: './gebruiker-create-edit-dialog.component.scss',
})
export class GebruikerCreateEditDialogComponent implements OnInit {
  username?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  // not sure if this avatar 'file' can also be a url like this
  // only one way to find out!
  avatar =
    'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
    this.name +
    '&backgroundColor=f1f4dc,f88c49,ffd5dc,ffdfbf,d1d4f9,c0aede&backgroundType=gradientLinear&shapeColor=69d2e7,f1f4dc,f88c49';
  selectedRollen: Rol[] = []; //ids
  groep?: string; //id
  speler?: string; // id

  loading = signal(false);
  groepen: WritableSignal<Groep[]> = signal([]);
  spelers: WritableSignal<Speler[]> = signal([]);
  rollen: WritableSignal<Rol[]> = signal([]);

  client = inject(PocketbaseService);
  dialogRef = inject(MatDialogRef<GebruikerCreateEditDialogComponent>);

  async ngOnInit(): Promise<void> {
    this.spelers.set(await this.client.getAll<Speler>('spelers'));
    this.groepen.set(await this.client.getAll<Groep>('groepen'));
    this.rollen.set(await this.client.getAll<Rol>('rollen'));
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    const gebruiker = {
      username: this.username,
      email: this.email,
      password: this.password,
      passwordConfirm: this.passwordConfirm,
      name: this.name,
      // avatar: this.avatar,
      rollen: this.selectedRollen?.map((r) => r.id),
      groep: this.groep,
      speler: this.speler,
      emailVisibility: true,
    };

    const created = await this.client.create<Gebruiker>('users', gebruiker);

    this.dialogRef.close(created);
    this.loading.set(false);
  }

  formIsValid() {
    return (
      !!this.username &&
      this.username != '' &&
      !!this.email &&
      this.email != '' &&
      !!this.password &&
      this.password != '' &&
      !!this.passwordConfirm &&
      this.passwordConfirm != '' &&
      !!this.name &&
      this.name != ''
      // !!this.avatar &&
      // this.avatar != ''

      // allow having 0 roles?
      // !!this.selectedRollen &&
      // this.selectedRollen?.length > 0 &&

      // based on role(s)?
      // !!this.groep &&
      // this.groep != '' &&
      // !!this.speler &&
      // this.speler != ''
    );
  }
}
