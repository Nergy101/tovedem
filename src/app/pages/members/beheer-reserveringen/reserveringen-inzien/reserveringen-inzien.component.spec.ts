import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSelectChange } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';

import { ReserveringenInzienComponent } from './reserveringen-inzien.component';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { VerificationService } from '../../../../shared/services/verification.service';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { LosseVerkoop } from '../../../../models/domain/losse-verkoop.model';

const RECORD_BASE = {
  collectionId: 'col',
  collectionName: 'test',
  created: '2026-01-01 00:00:00.000Z',
  updated: '2026-01-01 00:00:00.000Z',
};

function makeReservering(overrides: Partial<Reservering> = {}): Reservering {
  return {
    ...RECORD_BASE,
    id: 'res-1',
    collectionName: 'reserveringen',
    email: 'jan@example.com',
    voornaam: 'Jan',
    achternaam: 'Jansen',
    is_vriend_van_tovedem: false,
    is_lid_van_vereniging: true,
    voorstelling: 'v-1',
    datum_tijd_1_aantal: 0,
    datum_tijd_2_aantal: 0,
    opmerking: '',
    guid: 'guid-1',
    aanwezig_datum_1: false,
    aanwezig_datum_2: false,
    ...overrides,
  } as Reservering;
}

function makeVoorstelling(overrides: Partial<Voorstelling> = {}): Voorstelling {
  return {
    ...RECORD_BASE,
    id: 'v-1',
    collectionName: 'voorstellingen',
    titel: 'De onverwachte gast',
    datum_tijd_1: '2026-12-01T19:00:00.000Z',
    datum_tijd_2: '2026-12-02T19:00:00.000Z',
    beschikbare_stoelen_datum_tijd_1: 100,
    beschikbare_stoelen_datum_tijd_2: 80,
    ...overrides,
  } as Voorstelling;
}

function makeLosseVerkoop(overrides: Partial<LosseVerkoop> = {}): LosseVerkoop {
  return {
    ...RECORD_BASE,
    id: 'lv-1',
    collectionName: 'losse_verkoop',
    aantal: 0,
    voorstelling: 'v-1',
    datum: 'datum1',
    ...overrides,
  } as LosseVerkoop;
}

describe('ReserveringenInzienComponent', () => {
  let component: ReserveringenInzienComponent;
  let clientMock: jasmine.SpyObj<PocketbaseService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    clientMock = jasmine.createSpyObj<PocketbaseService>('PocketbaseService', [
      'update',
      'create',
      'delete',
      'getAll',
      'getPage',
      'getOne',
    ]);
    clientMock.update.and.returnValue(Promise.resolve(makeReservering()));

    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        ReserveringenInzienComponent,
        { provide: PocketbaseService, useValue: clientMock },
        { provide: Router, useValue: routerMock },
        { provide: MatDialog, useValue: { open: (): unknown => ({ afterClosed: (): undefined => undefined }) } },
        { provide: ToastrService, useValue: { success: (): void => undefined, error: (): void => undefined } },
        { provide: ThemeService, useValue: {} },
        { provide: VerificationService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
      ],
    });

    component = TestBed.inject(ReserveringenInzienComponent);
  });

  describe('stoelen per dag', () => {
    it('splits reservations into aanwezig, gereserveerd and vrij', () => {
      component.selectedVoorstelling.set(makeVoorstelling());
      component.reserveringenOfSelectedVoorstelling.set([
        makeReservering({
          id: 'a',
          datum_tijd_1_aantal: 3,
          aanwezig_datum_1: true,
        }),
        makeReservering({
          id: 'b',
          datum_tijd_1_aantal: 2,
          aanwezig_datum_1: false,
        }),
      ]);

      // [aanwezig, losse verkoop, gereserveerd, vrij]
      expect(component.seriesDatum1()).toEqual([3, 0, 2, 95]);
      expect(component.totalUsedDatum1()).toBe(5);
      expect(component.totalAvailableDatum1()).toBe(100);
    });

    it('subtracts loose sales from the free seats of the matching day only', () => {
      component.selectedVoorstelling.set(makeVoorstelling());
      component.reserveringenOfSelectedVoorstelling.set([]);
      component.losseVerkoopOfSelectedVoorstelling.set([
        makeLosseVerkoop({ id: 'lv-1', aantal: 4, datum: 'datum1' }),
        makeLosseVerkoop({ id: 'lv-2', aantal: 6, datum: 'datum2' }),
      ]);

      expect(component.seriesDatum1()).toEqual([0, 4, 0, 96]);
      expect(component.seriesDatum2()).toEqual([0, 6, 0, 74]);
    });

    it('keeps the days strictly separated', () => {
      component.selectedVoorstelling.set(makeVoorstelling());
      component.reserveringenOfSelectedVoorstelling.set([
        makeReservering({
          id: 'dag1',
          datum_tijd_1_aantal: 5,
          datum_tijd_2_aantal: 1,
          aanwezig_datum_2: true,
        }),
      ]);

      expect(component.seriesDatum1()).toEqual([0, 0, 5, 95]);
      expect(component.seriesDatum2()).toEqual([1, 0, 0, 79]);
      expect(component.seriesVoorDag()).toEqual([0, 0, 5, 95]);

      component.selectedDag.set('datum2');
      expect(component.seriesVoorDag()).toEqual([1, 0, 0, 79]);
    });

    it('counts zero seats when no voorstelling is selected', () => {
      component.reserveringenOfSelectedVoorstelling.set([
        makeReservering({ datum_tijd_1_aantal: 2 }),
      ]);

      expect(component.seriesDatum1()).toEqual([0, 0, 2, -2]);
      expect(component.totalAvailableDatum1()).toBe(0);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      component.reserveringenOfSelectedVoorstelling.set([
        makeReservering({
          id: 'jan',
          voornaam: 'Jan',
          achternaam: 'Jansen',
          email: 'jan@example.com',
        }),
        makeReservering({
          id: 'piet',
          voornaam: 'Piet',
          achternaam: 'Pietersen',
          email: 'piet@example.com',
        }),
      ]);
    });

    it('matches case-insensitively on name, surname and email', () => {
      expect(component['_filter']('JAN').map((r) => r.id)).toEqual(['jan']);
      expect(component['_filter']('pietersen').map((r) => r.id)).toEqual([
        'piet',
      ]);
      expect(component['_filter']('jan@').map((r) => r.id)).toEqual(['jan']);
    });

    it('returns everything for an empty search term', () => {
      expect(component['_filter']('').length).toBe(2);
    });

    it('formats an option as name and email', () => {
      expect(component.displayFn(component.reserveringenOfSelectedVoorstelling()[0]))
        .toBe('Jan Jansen - jan@example.com');
      expect(component.displayFn(undefined)).toBe('');
    });

    it('selects the matching reservation and clears the selection again', () => {
      component.setSelectedOption(makeReservering({ id: 'piet' }));
      expect(component.selectedOption()?.id).toBe('piet');

      component.clearReservatieSearch();
      expect(component.selectedOption()).toBeNull();
      expect(component.reservatieSearchModel().searchTerm).toBe('');
    });

    it('ignores a selection that is not in the current list', () => {
      component.setSelectedOption(makeReservering({ id: 'onbekend' }));
      expect(component.selectedOption()).toBeNull();
    });

    it('switches the selected day', () => {
      component.setSelectedDag({ value: 'datum2' } as MatButtonToggleChange);
      expect(component.selectedDag()).toBe('datum2');
    });

    it('navigates with the voorstellingId when a voorstelling is chosen', () => {
      const voorstelling = makeVoorstelling();
      component.setSelectedVoorstelling({
        value: voorstelling,
      } as MatSelectChange);

      expect(component.selectedVoorstelling()).toBe(voorstelling);
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { voorstellingId: 'v-1' },
      });
    });
  });

  describe('onCheckboxChange', () => {
    it('toggles presence for datum1 and persists it', () => {
      const reservering = makeReservering({ aanwezig_datum_1: false });
      component.reserveringenOfSelectedVoorstelling.set([reservering]);

      component.onCheckboxChange({ reservering, dag: 1 });

      expect(reservering.aanwezig_datum_1).toBeTrue();
      expect(reservering.aanwezig_datum_2).toBeFalse();
      expect(clientMock.update).toHaveBeenCalledWith('reserveringen', reservering);
    });

    it('toggles presence for datum2 without touching datum1', () => {
      const reservering = makeReservering({
        aanwezig_datum_1: false,
        aanwezig_datum_2: true,
      });
      component.reserveringenOfSelectedVoorstelling.set([reservering]);

      component.onCheckboxChange({ reservering, dag: 2 });

      expect(reservering.aanwezig_datum_2).toBeFalse();
      expect(reservering.aanwezig_datum_1).toBeFalse();
    });
  });
});
