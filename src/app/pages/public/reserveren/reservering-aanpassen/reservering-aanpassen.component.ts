import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { tap } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { Groep } from '../../../../models/domain/groep.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { ErrorService } from '../../../../shared/services/error.service';
import { LoginRequiredDialogComponent } from './login-required-dialog/login-required-dialog.component';
import { PastDateDialogComponent } from './past-date-dialog/past-date-dialog.component';
import { ConfirmatieDialogComponent } from '../../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';

@Component({
  selector: 'app-reservering-aanpassen',
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
  styleUrl: './reservering-aanpassen.component.scss',
})
export class ReserveringAanpassenComponent {
  router = inject(Router);
  route = inject(ActivatedRoute);
  toastr = inject(ToastrService);
  dialog = inject(MatDialog);
  client = inject(PocketbaseService);
  reserveringId = signal<string | undefined>(undefined);
  reserveringGuid = signal<string | undefined>(undefined);
  reservering = signal<Reservering | undefined>(undefined);
  snackBar = inject(MatSnackBar);
  authService = inject(AuthService);
  errorService = inject(ErrorService);

  name = signal('');
  surname = signal('');
  email = signal('');
  vriendVanTovedem = signal(false);
  lidVanTovedemMejotos = signal(false);
  opmerking = signal('');

  opmerkingLength = signal('');
  amountOfPeopleDate1 = signal(0);
  amountOfPeopleDate2 = signal(0);
  saving = signal(false);

  isPastDate = computed(() => {
    // Use the new 8-hour-before logic
    // If both dates exist and both are past the 8-hour threshold, or if only datum1 exists and it's past
    if (this.datum1 && this.datum2) {
      return this.isDatum1Past() && this.isDatum2Past();
    }
    // If only datum1 exists and it's past the 8-hour threshold
    return this.isDatum1Past();
  });

  isDatum1Past = computed(() => {
    if (!this.datum1) return false;
    // Check if current time is 8 hours or more before the performance time
    const eightHoursBefore = new Date(
      this.datum1.getTime() - 8 * 60 * 60 * 1000
    );
    return this.today >= eightHoursBefore;
  });

  isDatum2Past = computed(() => {
    if (!this.datum2) return false;
    // Check if current time is 8 hours or more before the performance time
    const eightHoursBefore = new Date(
      this.datum2.getTime() - 8 * 60 * 60 * 1000
    );
    return this.today >= eightHoursBefore;
  });

  formIsValid = computed(() => {
    return (
      !!this.name() &&
      !!this.email &&
      !!this.surname &&
      (this.amountOfPeopleDate1() > 0 || this.amountOfPeopleDate2() > 0) &&
      !this.isPastDate()
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
      .pipe(
        tap((params) => {
          this.reserveringId.set(params.id);
          this.reserveringGuid.set(params.guid);
        }),
        takeUntilDestroyed()
      )
      .subscribe();

    effect(
      async () => {
        if (!this.reserveringId()) return;
        this.loaded.set(false);

        // Check if user is logged in
        if (!this.authService.isLoggedIn()) {
          this.dialog.open(LoginRequiredDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
          });
          this.router.navigate(['/']);
          return;
        }

        try {
          let reservering: Reservering | null = null;
          let voorstelling: Voorstelling | null = null;
          let groep: Groep | null = null;

          // Strategy 1: Try with full expand (voorstelling.groep)
          try {
            reservering = await this.client.getOne<Reservering>(
              'reserveringen',
              this.reserveringId()!,
              {
                expand: 'voorstelling.groep',
              }
            );

            // Check if expand was successful
            if (
              reservering.expand?.voorstelling &&
              reservering.expand.voorstelling.expand?.groep
            ) {
              voorstelling = reservering.expand.voorstelling as Voorstelling;
              groep = reservering.expand.voorstelling.expand.groep as Groep;
            } else {
              // Expand partially failed, try strategy 2
              throw new Error('Expand failed');
            }
          } catch (error) {
            // Strategy 2: Try with only voorstelling expand
            try {
              reservering = await this.client.getOne<Reservering>(
                'reserveringen',
                this.reserveringId()!,
                {
                  expand: 'voorstelling',
                }
              );

              if (reservering.expand?.voorstelling) {
                voorstelling = reservering.expand.voorstelling as Voorstelling;
                // Try to fetch groep separately
                try {
                  groep = await this.client.getOne<Groep>(
                    'groepen',
                    voorstelling.groep
                  );
                } catch (groepError) {
                  console.warn('Could not fetch groep:', groepError);
                  // Continue without groep data
                }
              } else {
                throw new Error('Voorstelling expand failed');
              }
            } catch (error2) {
              // Strategy 3: Fetch everything separately
              try {
                reservering = await this.client.getOne<Reservering>(
                  'reserveringen',
                  this.reserveringId()!
                );

                if (reservering.voorstelling) {
                  try {
                    voorstelling = await this.client.getOne<Voorstelling>(
                      'voorstellingen',
                      reservering.voorstelling
                    );

                    if (voorstelling.groep) {
                      try {
                        groep = await this.client.getOne<Groep>(
                          'groepen',
                          voorstelling.groep
                        );
                      } catch (groepError) {
                        console.warn('Could not fetch groep:', groepError);
                      }
                    }
                  } catch (voorstellingError) {
                    console.warn(
                      'Could not fetch voorstelling:',
                      voorstellingError
                    );
                    throw new Error('Voorstelling not found');
                  }
                } else {
                  throw new Error('Reservering has no voorstelling reference');
                }
              } catch (error3) {
                // All strategies failed
                this.toastr.error(
                  'De reservering kon niet worden geladen. De reservering of gerelateerde gegevens zijn mogelijk verwijderd.',
                  'Fout',
                  {
                    positionClass: 'toast-bottom-right',
                  }
                );
                this.router.navigate(['/']);
                return;
              }
            }
          }

          // Validate reservering exists
          if (!reservering) {
            this.toastr.error(
              'De reservering kon niet worden gevonden.',
              'Fout',
              {
                positionClass: 'toast-bottom-right',
              }
            );
            this.router.navigate(['/']);
            return;
          }

          // Validate GUID
          if (this.reserveringGuid() !== reservering.guid) {
            this.toastr.error(
              'De link is ongeldig. Gebruik de link uit uw bevestigingsmail.',
              'Ongeldige link',
              {
                positionClass: 'toast-bottom-right',
              }
            );
            this.router.navigate(['/']);
            return;
          }

          // Validate voorstelling exists
          if (!voorstelling) {
            this.toastr.error(
              'De voorstelling van deze reservering kon niet worden gevonden.',
              'Fout',
              {
                positionClass: 'toast-bottom-right',
              }
            );
            this.router.navigate(['/']);
            return;
          }

          // Set reservering data
          this.reservering.set(reservering);
          this.name.set(reservering.voornaam);
          this.surname.set(reservering.achternaam);
          this.email.set(reservering.email);
          this.vriendVanTovedem.set(reservering.is_vriend_van_tovedem);
          this.lidVanTovedemMejotos.set(reservering.is_lid_van_vereniging);
          this.amountOfPeopleDate1.set(reservering.datum_tijd_1_aantal);
          this.amountOfPeopleDate2.set(reservering.datum_tijd_2_aantal);
          this.opmerking.set(reservering.opmerking || '');

          // Set voorstelling data
          this.voorstellingsNaam = voorstelling.titel;
          this.datum1 = new Date(voorstelling.datum_tijd_1);
          if (voorstelling.datum_tijd_2) {
            this.datum2 = new Date(voorstelling.datum_tijd_2);
          }

          // Check if voorstelling dates are in the past
          const now = new Date();
          const isDatum1Past = this.datum1 && this.datum1 <= now;
          const isDatum2Past = this.datum2 && this.datum2 <= now;

          // If both dates exist and both are past, or if only datum1 exists and it's past, redirect
          if (this.datum1 && this.datum2) {
            if (isDatum1Past && isDatum2Past) {
              this.dialog.open(PastDateDialogComponent, {
                disableClose: true,
                hasBackdrop: true,
              });
              this.router.navigate(['/']);
              return;
            }
          } else if (isDatum1Past) {
            // Only datum1 exists and it's past
            this.dialog.open(PastDateDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
            });
            this.router.navigate(['/']);
            return;
          }

          // Set groep data (if available)
          if (groep) {
            this.groepsNaam = groep.naam;
          } else {
            this.groepsNaam = 'Onbekend';
            console.warn('Groep data niet beschikbaar');
          }

          this.loaded.set(true);
        } catch (error: any) {
          console.error('Error loading reservering:', error);

          // Check if it's an unauthorized error (email mismatch or not authorized)
          if (
            error?.status === 403 ||
            error?.response?.code === 403 ||
            error?.message?.includes('unauthorized')
          ) {
            this.toastr.error(
              'U bent niet geautoriseerd om deze reservering aan te passen. Zorg dat u ingelogd bent met het email adres dat overeenkomt met de reservering.',
              'Niet Geautoriseerd',
              {
                positionClass: 'toast-bottom-right',
              }
            );
          } else {
            this.toastr.error(
              'Er is een onverwachte fout opgetreden bij het laden van de reservering.',
              'Fout',
              {
                positionClass: 'toast-bottom-right',
              }
            );
          }
          this.router.navigate(['/']);
        }
      },
      { allowSignalWrites: true }
    );
  }

  async saveReservering(): Promise<void> {
    // Check if voorstelling dates are in the past before saving
    const now = new Date();
    const isDatum1Past = this.datum1 && this.datum1 <= now;
    const isDatum2Past = this.datum2 && this.datum2 <= now;

    // If both dates exist and both are past, or if only datum1 exists and it's past, show dialog and prevent save
    if (this.datum1 && this.datum2) {
      if (isDatum1Past && isDatum2Past) {
        this.dialog.open(PastDateDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
        });
        return;
      }
    } else if (isDatum1Past) {
      // Only datum1 exists and it's past
      this.dialog.open(PastDateDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
      });
      return;
    }

    this.saving.set(true);

    try {
      const currentReservering = this.reservering();
      if (!currentReservering) {
        this.toastr.error('De reservering kon niet worden gevonden.', 'Fout', {
          positionClass: 'toast-bottom-right',
        });
        this.saving.set(false);
        return;
      }

      // Use voorstelling ID from the reservering object (not from expand)
      const voorstellingId =
        currentReservering.voorstelling ||
        (currentReservering.expand?.voorstelling as any)?.id;

      if (!voorstellingId) {
        this.toastr.error('De voorstelling kon niet worden gevonden.', 'Fout', {
          positionClass: 'toast-bottom-right',
        });
        this.saving.set(false);
        return;
      }

      await this.client.update<Reservering>('reserveringen', {
        id: currentReservering.id,
        created: currentReservering.created,
        updated: new Date().toISOString(),
        voornaam: this.name(),
        achternaam: this.surname(),
        email: this.email(),
        is_vriend_van_tovedem: this.vriendVanTovedem(),
        is_lid_van_vereniging: this.lidVanTovedemMejotos(),
        voorstelling: voorstellingId,
        datum_tijd_1_aantal: this.amountOfPeopleDate1() ?? 0,
        datum_tijd_2_aantal: this.amountOfPeopleDate2() ?? 0,
        opmerking: this.opmerking() || '',
        guid: currentReservering.guid,
        aanwezig_datum_1: currentReservering.aanwezig_datum_1 ?? false,
        aanwezig_datum_2: currentReservering.aanwezig_datum_2 ?? false,
      });

      this.toastr.success('De reservering is aangepast', 'Gelukt!', {
        positionClass: 'toast-bottom-right',
      });
      this.router.navigate(['/']);
    } catch (error: unknown) {
      // Use ErrorService for consistent error handling
      const appError = this.errorService.parseError(
        error,
        'Reservering aanpassen'
      );
      const errorMessage = this.errorService.getUserMessage(appError);

      // Special handling for authorization errors
      if (appError.type === 'AUTHORIZATION') {
        this.toastr.error(
          'U bent niet geautoriseerd om deze reservering aan te passen. Zorg dat u ingelogd bent met het email adres dat overeenkomt met de reservering.',
          'Niet Geautoriseerd',
          {
            positionClass: 'toast-bottom-right',
          }
        );
      } else {
        this.toastr.error(errorMessage, 'Fout', {
          positionClass: 'toast-bottom-right',
        });
      }
    } finally {
      this.saving.set(false);
    }
  }

  onEmailChanged(newValue: string): void {
    this.email.set(newValue);
  }

  onNameChanged(newValue: string): void {
    this.name.set(newValue);
  }

  onOpmerkingChange(newValue: string): void {
    this.opmerking.set(newValue);
  }

  onOpmerkingChange2(event: Event): void {
    this.opmerkingLength.set((event.target as HTMLInputElement).value);
  }

  onSurnameChanged(newValue: string): void {
    this.surname.set(newValue);
  }

  vriendVanTovedemChanged(newValue: boolean): void {
    this.vriendVanTovedem.set(newValue);
  }

  lidVanTovedemMejotosChanged(newValue: boolean): void {
    this.lidVanTovedemMejotos.set(newValue);
  }

  amountOfPeopleDate1Changed(newValue: number): void {
    this.amountOfPeopleDate1.set(newValue);
  }

  amountOfPeopleDate2Changed(newValue: number): void {
    this.amountOfPeopleDate2.set(newValue);
  }

  async deleteReservering(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Reservering intrekken',
        message: 'Weet je zeker dat je deze reservering wilt intrekken?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

    const currentReservering = this.reservering();
    if (!currentReservering) {
      this.toastr.error('De reservering kon niet worden gevonden.', 'Fout', {
        positionClass: 'toast-bottom-right',
      });
      return;
    }

    this.saving.set(true);

    try {
      await this.client.delete('reserveringen', currentReservering.id);
      this.toastr.success('De reservering is ingetrokken', 'Gelukt!', {
        positionClass: 'toast-bottom-right',
      });
      this.router.navigate(['/']);
    } catch (error: unknown) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        'Reservering intrekken'
      );
      this.toastr.error(errorMessage, 'Fout', {
        positionClass: 'toast-bottom-right',
      });
    } finally {
      this.saving.set(false);
    }
  }
}
