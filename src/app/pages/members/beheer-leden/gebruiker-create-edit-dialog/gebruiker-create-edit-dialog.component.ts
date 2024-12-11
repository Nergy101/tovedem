import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { QuillModule } from 'ngx-quill';
import { Gebruiker } from '../../../../models/domain/gebruiker.model';
import { Groep } from '../../../../models/domain/groep.model';
import { Rol } from '../../../../models/domain/rol.model';
import { Speler } from '../../../../models/domain/speler.model';
import { TovedemFilePickerComponent } from '../../../../shared/components/tovedem-file-picker/tovedem-file-picker.component';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
    selector: 'app-gebruiker-create-edit-dialog',
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
    styleUrl: './gebruiker-create-edit-dialog.component.scss'
})
export class GebruikerCreateEditDialogComponent implements OnInit {
  gebruiker: Gebruiker = {
    id: '',
    created: '',
    updated: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    rollen: [],
    groep: undefined,
    speler: undefined,
    emailVisibility: true,
  };

  // not sure if this avatar 'file' can also be a url like this
  // only one way to find out!
  avatar =
    'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
    this.gebruiker.name +
    '&backgroundColor=f1f4dc,f88c49,ffd5dc,ffdfbf,d1d4f9,c0aede&backgroundType=gradientLinear&shapeColor=69d2e7,f1f4dc,f88c49';

  loading = signal(false);
  groepen: WritableSignal<Groep[] | null> = signal(null);
  spelers: WritableSignal<Speler[] | null> = signal(null);
  rollen: WritableSignal<Rol[] | null> = signal(null);

  client = inject(PocketbaseService);
  dialogRef = inject(MatDialogRef<GebruikerCreateEditDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  get isUpdate() {
    return !!this.data?.existingGebruiker;
  }

  async ngOnInit(): Promise<void> {
    if (!!this.data?.existingGebruiker) {
      const existing = this.data.existingGebruiker;
      this.gebruiker = existing;
    }

    this.spelers.set(await this.client.getAll<Speler>('spelers'));
    this.groepen.set(await this.client.getAll<Groep>('groepen'));
    this.rollen.set(await this.client.getAll<Rol>('rollen'));
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    if (this.isUpdate) {
      const gebruiker = this.gebruiker;
      const updated = await this.client.update<Gebruiker>('users', gebruiker);
      this.dialogRef.close(updated);
    } else {
      const gebruiker = {
        username: this.gebruiker.username,
        email: this.gebruiker.email,
        password: this.gebruiker.password,
        passwordConfirm: this.gebruiker.passwordConfirm,
        name: this.gebruiker.name,
        rollen: this.gebruiker.rollen,
        groep: this.gebruiker.groep,
        speler: this.gebruiker.speler,
        emailVisibility: true,
      };
      const created = await this.client.create<Gebruiker>('users', gebruiker);
      this.dialogRef.close(created);
    }
    this.loading.set(false);
  }

  formIsValid() {
    if (this.isUpdate) {
      return (
        !!this.gebruiker.username &&
        this.gebruiker.username != '' &&
        !!this.gebruiker.email &&
        this.gebruiker.email != '' &&
        !!this.gebruiker.name &&
        this.gebruiker.name != ''
      );
    } else {
      return (
        !!this.gebruiker.username &&
        this.gebruiker.username != '' &&
        !!this.gebruiker.email &&
        this.gebruiker.email != '' &&
        !!this.gebruiker.password &&
        this.gebruiker.password != '' &&
        !!this.gebruiker.name &&
        this.gebruiker.name != '' &&
        !!this.gebruiker.passwordConfirm &&
        this.gebruiker.passwordConfirm != ''
      );
    }
  }
}
