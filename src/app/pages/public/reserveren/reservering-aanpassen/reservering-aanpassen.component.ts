import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { Reservering } from '../../../../models/domain/reservering.model';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reservering-aanpassen',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './reservering-aanpassen.component.html',
  styleUrl: './reservering-aanpassen.component.scss'
})
export class ReserveringAanpassenComponent {

  router = inject(Router);
  route = inject(ActivatedRoute);
  toastr = inject(ToastrService);
  reserveringId = signal<string | undefined>(undefined);
  reserveringGuid = signal<string | undefined>(undefined);
  reservering = signal<any | undefined>(undefined);
  client = inject(PocketbaseService);
  snackBar = inject(MatSnackBar);

  name = signal('');
  surname = signal('');
  email = signal('');
  vriendVanTovedem = signal(false);
  lidVanTovedemMejotos = signal(false);
  opmerking = signal("");
  
  opmerkingLength = signal('');
  amountOfPeopleDate1 = signal(0);
  amountOfPeopleDate2 = signal(0);
  saving = signal(false);

  formIsValid = computed(() => {
    return (
      !!this.name() &&
      !!this.email &&
      !!this.surname &&
      (this.amountOfPeopleDate1() > 0 || this.amountOfPeopleDate2() > 0)
    );
  });

  loaded = signal(false);

  voorstellingOmschrijving = '';
  voorstellingsNaam = '';
  groepsNaam = '';
  datum1: Date | null = null;
  datum2: Date | null = null;
  today = new Date();

  constructor() {
    this.route.params
      .pipe(tap(
        params => {
          this.reserveringId.set(params.id);
          this.reserveringGuid.set(params.guid);
        }
      ),
        takeUntilDestroyed())
      .subscribe()


    effect(async () => {
      if (!this.reserveringId()) return;
      this.loaded.set(false);
      const reservering = await this.client.getOne<Reservering>('reserveringen', this.reserveringId()!,
        {
          expand: 'voorstelling.groep'
        });

      if (this.reserveringGuid() !== reservering.guid) {
        this.router.navigate(['/']);
      }

      if (!reservering) {
        this.router.navigate(['/']);
      }

      this.reservering.set(reservering!);

      this.voorstellingsNaam = reservering.expand!.voorstelling.titel;
      this.groepsNaam = reservering.expand!.voorstelling.expand.groep.naam;
      this.name.set(reservering.voornaam);
      this.surname.set(reservering.achternaam);
      this.email.set(reservering.email);
      this.vriendVanTovedem.set(reservering.is_vriend_van_tovedem);
      this.lidVanTovedemMejotos.set(reservering.is_lid_van_vereniging);
      this.datum1 = new Date(reservering.expand!.voorstelling.datum_tijd_1);
      this.datum2 = new Date(reservering.expand!.voorstelling.datum_tijd_2);
      this.amountOfPeopleDate1.set(reservering.datum_tijd_1_aantal);
      this.amountOfPeopleDate2.set(reservering.datum_tijd_2_aantal);

      this.loaded.set(true);
    }, { allowSignalWrites: true });
  }

  async saveReservering(): Promise<void> {
    this.saving.set(true);

    const updatedReservering = await this.client.update<Reservering>(
      'reserveringen',
      {
        id: this.reservering().id,
        created: this.reservering().created,
        updated: new Date().toISOString(),
        voornaam: this.name(),
        achternaam: this.surname(),
        email: this.email(),
        is_vriend_van_tovedem: this.vriendVanTovedem(),
        is_lid_van_vereniging: this.lidVanTovedemMejotos(),
        voorstelling: this.reservering().expand.voorstelling.id,
        datum_tijd_1_aantal: this.amountOfPeopleDate1() ?? 0,
        datum_tijd_2_aantal: this.amountOfPeopleDate2() ?? 0,
        opmerking: this.reservering().opmerking,
        guid: this.reservering().guid
      }
    );

    this.toastr.success('De reservering is aangepast', "Gelukt!", {
      positionClass: 'toast-bottom-right'
    });

    this.saving.set(false);
  }

  onEmailChanged(newValue: string) {
    this.email.set(newValue);
  }

  onNameChanged(newValue: string) {
    this.name.set(newValue);
  }

  onOpmerkingChange(newValue: string){
    this.opmerking.set(newValue);
  }
  
  onOpmerkingChange2(event: Event){
    this.opmerkingLength.set((event.target as HTMLInputElement).value);
  }

  onSurnameChanged(newValue: string) {
    this.surname.set(newValue);
  }

  vriendVanTovedemChanged(newValue: boolean) {
    this.vriendVanTovedem.set(newValue);
  }

  lidVanTovedemMejotosChanged(newValue: boolean) {
    this.lidVanTovedemMejotos.set(newValue);
  }

  amountOfPeopleDate1Changed(newValue: number) {
    this.amountOfPeopleDate1.set(newValue);
  }

  amountOfPeopleDate2Changed(newValue: number) {
    this.amountOfPeopleDate2.set(newValue);
  }
}
