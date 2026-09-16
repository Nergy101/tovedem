import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DateTime } from 'luxon';

import { KassaComponent } from './kassa.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { AuthService } from '../../../shared/services/auth.service';
import { VerificationService } from '../../../shared/services/verification.service';
import { Reservering } from '../../../models/domain/reservering.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';

const RECORD_BASE = {
  collectionId: 'col',
  collectionName: 'test',
  created: '2026-01-01 00:00:00.000Z',
  updated: '2026-01-01 00:00:00.000Z',
};

/** Today at 20:00 Amsterdam time, expressed as UTC - used for "today" checks. */
const TODAY_UTC = DateTime.now()
  .setZone('Europe/Amsterdam')
  .startOf('day')
  .plus({ hours: 20 })
  .toUTC()
  .toISO({ suppressMilliseconds: false })!;

const OTHER_DAY_UTC = DateTime.now()
  .setZone('Europe/Amsterdam')
  .plus({ days: 5 })
  .startOf('day')
  .plus({ hours: 20 })
  .toUTC()
  .toISO({ suppressMilliseconds: false })!;

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
    datum_tijd_1_aantal: 2,
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
    datum_tijd_1: OTHER_DAY_UTC,
    datum_tijd_2: '',
    ...overrides,
  } as Voorstelling;
}

describe('KassaComponent', () => {
  let component: KassaComponent;
  let clientMock: jasmine.SpyObj<PocketbaseService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;

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

    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', [
      'success',
      'error',
    ]);

    TestBed.configureTestingModule({
      providers: [
        KassaComponent,
        { provide: PocketbaseService, useValue: clientMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: MatDialog, useValue: { open: (): void => undefined } },
        { provide: AuthService, useValue: { isLoggedIn: (): boolean => true } },
        { provide: Title, useValue: { setTitle: (): void => undefined } },
        { provide: VerificationService, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });

    component = TestBed.inject(KassaComponent);
  });

  describe('filterReserveringen', () => {
    beforeEach(() => {
      component.reserveringen.set([
        makeReservering({
          id: 'aanwezig-1',
          voornaam: 'Jan',
          achternaam: 'Jansen',
          email: 'jan@example.com',
          aanwezig_datum_1: true,
        }),
        makeReservering({
          id: 'afwezig-1',
          voornaam: 'Piet',
          achternaam: 'Pietersen',
          email: 'piet@example.com',
          aanwezig_datum_1: false,
        }),
        makeReservering({
          id: 'aanwezig-2',
          voornaam: 'Kees',
          achternaam: 'de Boer',
          email: 'kees@example.com',
          aanwezig_datum_1: false,
          aanwezig_datum_2: true,
        }),
      ]);
    });

    it('shows everything when the filter is "alle"', () => {
      component.filterReserveringen();

      expect(component.filteredReserveringen().length).toBe(3);
    });

    it('filters on presence for the selected day', () => {
      component.aanwezigFilter.set('aanwezig');
      component.filterReserveringen();

      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'aanwezig-1',
      ]);

      component.selectedDag.set('datum2');
      component.filterReserveringen();

      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'aanwezig-2',
      ]);
    });

    it('filters on absence for the selected day', () => {
      component.aanwezigFilter.set('niet_aanwezig');
      component.filterReserveringen();

      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'afwezig-1',
        'aanwezig-2',
      ]);
    });

    it('searches case-insensitively on name, surname and email', () => {
      component.onSearchTermChanged('KEES');
      component.filterReserveringen();
      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'aanwezig-2',
      ]);

      component.onSearchTermChanged('pietersen');
      component.filterReserveringen();
      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'afwezig-1',
      ]);

      component.onSearchTermChanged('jan@example.com');
      component.filterReserveringen();
      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'aanwezig-1',
      ]);
    });

    it('searches on the full name', () => {
      component.onSearchTermChanged('piet pietersen');
      component.filterReserveringen();

      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'afwezig-1',
      ]);
    });

    it('combines the presence filter and the search term', () => {
      component.aanwezigFilter.set('aanwezig');
      component.onSearchTermChanged('piet');
      component.filterReserveringen();

      expect(component.filteredReserveringen()).toEqual([]);
    });

    it('re-filters when the presence filter changes', () => {
      component.onAanwezigFilterChange('aanwezig');

      expect(component.aanwezigFilter()).toBe('aanwezig');
      expect(component.filteredReserveringen().map((r) => r.id)).toEqual([
        'aanwezig-1',
      ]);
    });
  });

  describe('onCheckboxChange', () => {
    it('toggles presence for datum1 and persists it', () => {
      const reservering = makeReservering({ aanwezig_datum_1: false });
      component.reserveringen.set([reservering]);

      component.onCheckboxChange({ reservering, dag: 1 });

      expect(reservering.aanwezig_datum_1).toBeTrue();
      expect(reservering.aanwezig_datum_2).toBeFalse();
      expect(clientMock.update).toHaveBeenCalledWith('reserveringen', reservering);
      expect(toastrMock.success).toHaveBeenCalledWith('Aanwezigheid bijgewerkt');
    });

    it('toggles presence for datum2 without touching datum1', () => {
      const reservering = makeReservering({
        aanwezig_datum_1: false,
        aanwezig_datum_2: true,
      });
      component.reserveringen.set([reservering]);

      component.onCheckboxChange({ reservering, dag: 2 });

      expect(reservering.aanwezig_datum_2).toBeFalse();
      expect(reservering.aanwezig_datum_1).toBeFalse();
    });
  });

  describe('voorstellingen van vandaag', () => {
    it('recognises a voorstelling that plays today', () => {
      expect(
        component.isVoorstellingToday(
          makeVoorstelling({ datum_tijd_1: TODAY_UTC, datum_tijd_2: '' }),
        ),
      ).toBeTrue();
      expect(
        component.isVoorstellingToday(
          makeVoorstelling({ datum_tijd_1: OTHER_DAY_UTC, datum_tijd_2: '' }),
        ),
      ).toBeFalse();
    });

    it('recognises today on the second date as well', () => {
      expect(
        component.isVoorstellingToday(
          makeVoorstelling({ datum_tijd_1: OTHER_DAY_UTC, datum_tijd_2: TODAY_UTC }),
        ),
      ).toBeTrue();
      expect(
        component.isDatum1Today(
          makeVoorstelling({ datum_tijd_1: OTHER_DAY_UTC, datum_tijd_2: TODAY_UTC }),
        ),
      ).toBeFalse();
      expect(
        component.isDatum2Today(
          makeVoorstelling({ datum_tijd_1: OTHER_DAY_UTC, datum_tijd_2: TODAY_UTC }),
        ),
      ).toBeTrue();
    });

    it('shows the "eerstvolgende" button when nothing plays today', () => {
      component.voorstellingenVoorVandaag.set([
        makeVoorstelling({ datum_tijd_1: OTHER_DAY_UTC }),
      ]);

      expect(component.shouldShowEerstvolgendeButton()).toBeTrue();
    });

    it('hides the "eerstvolgende" button when something plays today', () => {
      component.voorstellingenVoorVandaag.set([
        makeVoorstelling({ datum_tijd_1: TODAY_UTC, datum_tijd_2: '' }),
      ]);

      expect(component.shouldShowEerstvolgendeButton()).toBeFalse();
    });

    it('shows the button when there are no voorstellingen at all', () => {
      component.voorstellingenVoorVandaag.set([]);

      expect(component.shouldShowEerstvolgendeButton()).toBeTrue();
    });
  });
});
