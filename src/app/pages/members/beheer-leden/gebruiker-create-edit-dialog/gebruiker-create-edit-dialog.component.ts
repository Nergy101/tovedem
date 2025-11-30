import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  Field,
  form,
  required,
  email,
  minLength,
  maxLength,
  debounce,
  validate,
} from '@angular/forms/signals';
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
import { GebruikerFormModel } from '../../../../models/form-models/gebruiker-form.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-gebruiker-create-edit-dialog',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    Field,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    QuillModule,
    NgxMaterialTimepickerModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'nl-NL' }],
  templateUrl: './gebruiker-create-edit-dialog.component.html',
  styleUrl: './gebruiker-create-edit-dialog.component.scss',
})
export class GebruikerCreateEditDialogComponent implements OnInit {
  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  gebruikerModel = signal<GebruikerFormModel>({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    rollen: [],
    groep: null,
    speler: null,
  });

  gebruikerForm = form(this.gebruikerModel, (schemaPath) => {
    debounce(schemaPath.username, 500);
    debounce(schemaPath.email, 500);
    debounce(schemaPath.name, 500);
    debounce(schemaPath.password, 500);
    debounce(schemaPath.passwordConfirm, 500);
    required(schemaPath.username);
    maxLength(schemaPath.username, 30, {
      message: 'Gebruikersnaam mag maximaal 30 tekens lang zijn',
    });
    required(schemaPath.email);
    email(schemaPath.email);
    required(schemaPath.name);
    maxLength(schemaPath.name, 30, {
      message: 'Naam mag maximaal 30 tekens lang zijn',
    });
    maxLength(schemaPath.password, 30, {
      message: 'Wachtwoord mag maximaal 30 tekens lang zijn',
    });
    maxLength(schemaPath.passwordConfirm, 30, {
      message: 'Wachtwoord bevestiging mag maximaal 30 tekens lang zijn',
    });
    // Password validation is conditional - only required when creating (not updating)
    // We'll handle this in formIsValid computed signal
    // Custom validator for password match
    validate(schemaPath.passwordConfirm, ({ value, valueOf }) => {
      const confirmPassword = value();
      const password = valueOf(schemaPath.password);
      if (confirmPassword && password && confirmPassword !== password) {
        return {
          kind: 'passwordMismatch',
          message: 'Wachtwoorden komen niet overeen',
        };
      }
      return null;
    });
  });

  // not sure if this avatar 'file' can also be a url like this
  // only one way to find out!
  avatar = computed(
    () =>
      'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
      this.gebruikerModel().name +
      '&backgroundColor=f1f4dc,f88c49,ffd5dc,ffdfbf,d1d4f9,c0aede&backgroundType=gradientLinear&shapeColor=69d2e7,f1f4dc,f88c49'
  );

  loading = signal(false);
  groepen: WritableSignal<Groep[] | null> = signal(null);
  spelers: WritableSignal<Speler[] | null> = signal(null);
  rollen: WritableSignal<Rol[] | null> = signal(null);

  client = inject(PocketbaseService);
  dialogRef = inject(MatDialogRef<GebruikerCreateEditDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  toastr = inject(ToastrService);

  get isUpdate(): boolean {
    return !!this.data?.existingGebruiker;
  }

  async ngOnInit(): Promise<void> {
    if (this.data?.existingGebruiker) {
      const existing = this.data.existingGebruiker;
      // Populate form model with existing data
      this.gebruikerModel.set({
        username: existing.username,
        email: existing.email,
        password: '',
        passwordConfirm: '',
        name: existing.name,
        rollen: existing.rollen || [],
        groep: existing.groep || null,
        speler: existing.speler || null,
      });
    }

    this.spelers.set(
      await this.client.directClient.collection('spelers').getFullList()
    );
    this.groepen.set(
      await this.client.directClient.collection('groepen').getFullList()
    );
    this.rollen.set(
      await this.client.directClient.collection('rollen').getFullList()
    );
  }

  async submit(): Promise<void> {
    if (this.gebruikerForm().invalid()) {
      return;
    }

    this.loading.set(true);
    const formData = this.gebruikerModel();

    if (this.isUpdate) {
      const existing = this.data.existingGebruiker;
      const gebruiker: Gebruiker = {
        ...existing,
        username: formData.username,
        email: formData.email,
        name: formData.name,
        rollen: formData.rollen,
        groep: formData.groep || undefined,
        speler: formData.speler || undefined,
      };
      // Only update password if provided
      if (formData.password) {
        (gebruiker as any).password = formData.password;
        (gebruiker as any).passwordConfirm = formData.passwordConfirm;
      }
      const updated = await this.client.update<Gebruiker>('users', gebruiker);
      this.dialogRef.close(updated);
    } else {
      const gebruiker = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.name,
        rollen: formData.rollen,
        groep: formData.groep || undefined,
        speler: formData.speler || undefined,
        emailVisibility: true,
      };
      const created = await this.client.create<Gebruiker>('users', gebruiker);
      this.dialogRef.close(created);
    }
    this.loading.set(false);
  }

  formIsValid = computed(() => {
    const formData = this.gebruikerModel();
    const baseValid =
      this.gebruikerForm().valid() &&
      formData.username.length > 0 &&
      formData.email.length > 0 &&
      formData.name.length > 0 &&
      formData.rollen.length > 0;

    if (this.isUpdate) {
      return baseValid;
    } else {
      return (
        baseValid &&
        formData.password.length > 0 &&
        formData.passwordConfirm.length > 0 &&
        formData.password === formData.passwordConfirm
      );
    }
  });
}
