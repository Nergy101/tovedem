import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { DateTime } from 'luxon';
import { of } from 'rxjs';

import { ReserveringAanpassenComponent } from './reservering-aanpassen.component';
import { PastDateDialogComponent } from './past-date-dialog/past-date-dialog.component';
import { ConfirmatieDialogComponent } from '../../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { ErrorService } from '../../../../shared/services/error.service';
import { DateTimeService } from '../../../../shared/services/datetime.service';
import { Reservering } from '../../../../models/domain/reservering.model';

const FUTURE_UTC = '2026-12-01T19:00:00.000Z';
const PAST_UTC = '2020-01-01T19:00:00.000Z';

function makeReservering(overrides: Partial<Reservering> = {}): Reservering {
  return {
    id: 'res-1',
    collectionId: 'col-res',
    collectionName: 'reserveringen',
    created: '2026-01-01 00:00:00.000Z',
    updated: '2026-01-01 00:00:00.000Z',
    email: 'jan@example.com',
    voornaam: 'Jan',
    achternaam: 'Jansen',
    is_vriend_van_tovedem: false,
    is_lid_van_vereniging: true,
    voorstelling: 'voorstelling-1',
    datum_tijd_1_aantal: 2,
    datum_tijd_2_aantal: 0,
    opmerking: '',
    guid: 'guid-abc',
    aanwezig_datum_1: false,
    aanwezig_datum_2: false,
    ...overrides,
  };
}

describe('ReserveringAanpassenComponent', () => {
  let component: ReserveringAanpassenComponent;
  let clientMock: jasmine.SpyObj<PocketbaseService>;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let toastrMock: jasmine.SpyObj<ToastrService>;
  let routerMock: jasmine.SpyObj<Router>;
  let errorServiceMock: jasmine.SpyObj<ErrorService>;
  let dateTimeServiceMock: jasmine.SpyObj<DateTimeService>;

  function setup(): void {
    clientMock = jasmine.createSpyObj<PocketbaseService>('PocketbaseService', [
      'update',
      'delete',
      'getOne',
    ]);
    clientMock.update.and.returnValue(Promise.resolve(makeReservering()));
    clientMock.delete.and.returnValue(Promise.resolve(true));

    dialogMock = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogMock.open.and.returnValue({
      afterClosed: () => of(false),
    } as unknown as ReturnType<MatDialog['open']>);

    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', [
      'success',
      'error',
      'info',
      'warning',
    ]);
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);
    errorServiceMock = jasmine.createSpyObj<ErrorService>('ErrorService', [
      'parseError',
      'getUserMessage',
      'getErrorMessage',
    ]);
    errorServiceMock.parseError.and.returnValue({
      type: 'UNKNOWN',
      message: 'onbekend',
    } as ReturnType<ErrorService['parseError']>);
    errorServiceMock.getUserMessage.and.returnValue('Er ging iets mis');
    errorServiceMock.getErrorMessage.and.returnValue('Er ging iets mis');

    dateTimeServiceMock = jasmine.createSpyObj<DateTimeService>(
      'DateTimeService',
      ['isPastHoursBefore', 'toAmsterdamTime'],
    );
    dateTimeServiceMock.isPastHoursBefore.and.returnValue(false);
    dateTimeServiceMock.toAmsterdamTime.and.callFake((utc: string | null | undefined) =>
      utc ? DateTime.fromISO(utc, { zone: 'utc' }) : null,
    );

    TestBed.configureTestingModule({
      providers: [
        ReserveringAanpassenComponent,
        { provide: PocketbaseService, useValue: clientMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: MatSnackBar, useValue: { open: (): void => undefined } },
        { provide: AuthService, useValue: {} },
        { provide: ErrorService, useValue: errorServiceMock },
        { provide: DateTimeService, useValue: dateTimeServiceMock },
      ],
    });

    component = TestBed.inject(ReserveringAanpassenComponent);
  }

  beforeEach(setup);

  describe('saveReservering', () => {
    it('opens the past-date dialog and does not save when both dates are in the past', async () => {
      dateTimeServiceMock.isPastHoursBefore.and.returnValue(true);
      component.datum1Str = PAST_UTC;
      component.datum2Str = PAST_UTC;
      component.reservering.set(makeReservering());

      await component.saveReservering();

      expect(dialogMock.open).toHaveBeenCalledWith(PastDateDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
      });
      expect(clientMock.update).not.toHaveBeenCalled();
    });

    it('opens the past-date dialog when only datum1 exists and is in the past', async () => {
      dateTimeServiceMock.isPastHoursBefore.and.returnValue(true);
      component.datum1Str = PAST_UTC;
      component.datum2Str = null;
      component.reservering.set(makeReservering());

      await component.saveReservering();

      expect(dialogMock.open).toHaveBeenCalledWith(
        PastDateDialogComponent,
        jasmine.anything(),
      );
      expect(clientMock.update).not.toHaveBeenCalled();
    });

    it('saves when the dates are still in the future', async () => {
      component.datum1Str = FUTURE_UTC;
      component.reservering.set(makeReservering());

      await component.saveReservering();

      expect(clientMock.update).toHaveBeenCalled();
    });

    it('shows an error and does not save when the reservering is missing', async () => {
      component.datum1Str = FUTURE_UTC;
      component.reservering.set(undefined);

      await component.saveReservering();

      expect(clientMock.update).not.toHaveBeenCalled();
      expect(toastrMock.error).toHaveBeenCalledWith(
        'De reservering kon niet worden gevonden.',
        'Fout',
        jasmine.anything(),
      );
    });

    it('shows an error when the voorstelling reference is missing', async () => {
      component.datum1Str = FUTURE_UTC;
      component.reservering.set(
        makeReservering({ voorstelling: '' as unknown as string }),
      );

      await component.saveReservering();

      expect(clientMock.update).not.toHaveBeenCalled();
      expect(toastrMock.error).toHaveBeenCalledWith(
        'De voorstelling kon niet worden gevonden.',
        'Fout',
        jasmine.anything(),
      );
    });

    it('sends the edited fields and preserves guid and aanwezig flags', async () => {
      component.datum1Str = FUTURE_UTC;
      component.reservering.set(
        makeReservering({ aanwezig_datum_1: true, guid: 'guid-abc' }),
      );
      component.onNameChanged('Piet');
      component.onSurnameChanged('de Vries');
      component.onEmailChanged('piet@example.com');
      component.amountOfPeopleDate1Changed(3);
      component.amountOfPeopleDate2Changed(0);
      component.vriendVanTovedemChanged(true);
      component.onOpmerkingChange('Graag rolstoelplaats');

      await component.saveReservering();

      expect(clientMock.update).toHaveBeenCalledWith(
        'reserveringen',
        jasmine.objectContaining({
          id: 'res-1',
          guid: 'guid-abc',
          voornaam: 'Piet',
          achternaam: 'de Vries',
          email: 'piet@example.com',
          voorstelling: 'voorstelling-1',
          datum_tijd_1_aantal: 3,
          datum_tijd_2_aantal: 0,
          is_vriend_van_tovedem: true,
          aanwezig_datum_1: true,
          aanwezig_datum_2: false,
          opmerking: 'Graag rolstoelplaats',
        }),
      );
      expect(toastrMock.success).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });

    it('reports authorization failures with a dedicated message', async () => {
      component.datum1Str = FUTURE_UTC;
      component.reservering.set(makeReservering());
      clientMock.update.and.returnValue(Promise.reject(new Error('403')));
      errorServiceMock.parseError.and.returnValue({
        type: 'AUTHORIZATION',
        message: 'geen toegang',
      } as ReturnType<ErrorService['parseError']>);

      await component.saveReservering();

      expect(toastrMock.error).toHaveBeenCalledWith(
        jasmine.stringContaining('niet geautoriseerd'),
        'Niet Geautoriseerd',
        jasmine.anything(),
      );
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('deleteReservering', () => {
    it('does nothing when the confirmation is declined', async () => {
      component.reservering.set(makeReservering());

      await component.deleteReservering();

      expect(clientMock.delete).not.toHaveBeenCalled();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('deletes the reservering after confirmation', async () => {
      dialogMock.open.and.returnValue({
        afterClosed: () => of(true),
      } as unknown as ReturnType<MatDialog['open']>);
      component.reservering.set(makeReservering());

      await component.deleteReservering();

      expect(dialogMock.open).toHaveBeenCalledWith(
        ConfirmatieDialogComponent,
        jasmine.anything(),
      );
      expect(clientMock.delete).toHaveBeenCalledWith('reserveringen', 'res-1');
      expect(toastrMock.success).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('form validation', () => {
    it('is invalid without a name, surname, email or tickets', () => {
      expect(component.formIsValid()).toBeFalse();

      component.onNameChanged('Jan');
      component.onSurnameChanged('Jansen');
      component.onEmailChanged('jan@example.com');
      expect(component.formIsValid()).toBeFalse();

      component.amountOfPeopleDate1Changed(2);
      expect(component.formIsValid()).toBeTrue();
    });

    it('is invalid when the date has already passed', () => {
      component.onNameChanged('Jan');
      component.onSurnameChanged('Jansen');
      component.onEmailChanged('jan@example.com');
      component.amountOfPeopleDate1Changed(2);
      component.datum1Str = FUTURE_UTC;
      dateTimeServiceMock.isPastHoursBefore.and.returnValue(true);

      expect(component.formIsValid()).toBeFalse();
    });
  });
});
