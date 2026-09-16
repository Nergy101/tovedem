import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { PrintenComponent } from './printen.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { DateTimeService } from '../../../shared/services/datetime.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Reservering } from '../../../models/domain/reservering.model';
import { Sponsor } from '../../../models/domain/sponsor.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';

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
    datum_tijd_1_aantal: 2,
    datum_tijd_2_aantal: 0,
    opmerking: '',
    guid: 'guid-1',
    aanwezig_datum_1: false,
    aanwezig_datum_2: false,
    ...overrides,
  } as Reservering;
}

function makeSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    ...RECORD_BASE,
    id: 'sp-1',
    collectionName: 'sponsoren',
    voornaam: 'Jan',
    achternaam: 'Jansen',
    email: 'jan@example.com',
    ...overrides,
  } as Sponsor;
}

function makeVoorstelling(overrides: Partial<Voorstelling> = {}): Voorstelling {
  return {
    ...RECORD_BASE,
    id: 'v-1',
    collectionName: 'voorstellingen',
    titel: 'De onverwachte gast',
    datum_tijd_1: '2026-12-01T19:00:00.000Z',
    datum_tijd_2: '2026-12-02T19:00:00.000Z',
    ...overrides,
  } as Voorstelling;
}

describe('PrintenComponent', () => {
  let component: PrintenComponent;
  let dateTimeServiceMock: jasmine.SpyObj<DateTimeService>;

  beforeEach(() => {
    const clientMock = {
      directClient: {
        collection: (): { getFullList: () => Promise<unknown[]> } => ({
          getFullList: (): Promise<unknown[]> => Promise.resolve([]),
        }),
        filter: (): string => '',
      },
    };

    dateTimeServiceMock = jasmine.createSpyObj<DateTimeService>(
      'DateTimeService',
      ['formatDate'],
    );
    dateTimeServiceMock.formatDate.and.returnValue('1 december 2026');

    TestBed.configureTestingModule({
      providers: [
        PrintenComponent,
        { provide: PocketbaseService, useValue: clientMock },
        { provide: DateTimeService, useValue: dateTimeServiceMock },
        { provide: Title, useValue: { setTitle: (): void => undefined } },
        { provide: SeoService, useValue: { update: (): void => undefined } },
        { provide: Router, useValue: { navigate: (): void => undefined } },
        { provide: ToastrService, useValue: { error: (): void => undefined } },
      ],
    });

    component = TestBed.inject(PrintenComponent);
  });

  describe('aantallen', () => {
    it('does not count below zero', () => {
      component.decrementKinderen();
      component.decrementVriend();
      component.decrementSponsoring();

      expect(component.kinderenQuantity()).toBe(0);
      expect(component.vriendVanTovedemQuantity()).toBe(0);
      expect(component.sponsoringQuantity()).toBe(0);
    });

    it('counts up per category independently', () => {
      component.incrementKinderen();
      component.incrementKinderen();
      component.incrementVriend();

      expect(component.kinderenQuantity()).toBe(2);
      expect(component.vriendVanTovedemQuantity()).toBe(1);
      expect(component.sponsoringQuantity()).toBe(0);
    });
  });

  describe('custom namen', () => {
    it('ignores an empty name', () => {
      component.newCustomName.set('   ');
      component.addCustomName();

      expect(component.customNames()).toEqual([]);
    });

    it('adds a name and resets the inputs', () => {
      component.newCustomName.set('  Oma  ');
      component.newCustomQuantity.set(3);
      component.addCustomName();

      expect(component.customNames()).toEqual([{ name: 'Oma', quantity: 3 }]);
      expect(component.newCustomName()).toBe('');
      expect(component.newCustomQuantity()).toBe(1);
    });

    it('increments, decrements and removes a custom name', () => {
      component.newCustomName.set('Oma');
      component.newCustomQuantity.set(1);
      component.addCustomName();

      component.incrementCustomQuantity(0);
      expect(component.customNames()[0].quantity).toBe(2);

      component.decrementCustomQuantity(0);
      component.decrementCustomQuantity(0);
      expect(component.customNames()[0].quantity).toBe(0);

      component.removeCustomName(0);
      expect(component.customNames()).toEqual([]);
    });
  });

  describe('hasTickets', () => {
    it('is false without tickets', () => {
      expect(component.hasTickets).toBeFalse();
    });

    it('is true with a manual ticket', () => {
      component.incrementSponsoring();
      expect(component.hasTickets).toBeTrue();
    });

    it('is true when a printable reservering has tickets for the selected day', () => {
      component.sponsors.set([makeSponsor()]);
      component.reserveringenFromVoorstelling.set([
        makeReservering({ verificatie_status: 'verified', datum_tijd_1_aantal: 2 }),
      ]);

      expect(component.hasTickets).toBeTrue();
    });

    it('is false when the reservering has no tickets for the selected day', () => {
      component.sponsors.set([makeSponsor()]);
      component.reserveringenFromVoorstelling.set([
        makeReservering({
          verificatie_status: 'verified',
          datum_tijd_1_aantal: 0,
          datum_tijd_2_aantal: 2,
        }),
      ]);

      expect(component.hasTickets).toBeFalse();
    });
  });

  describe('printableReserveringen', () => {
    it('is empty while sponsors are still loading', () => {
      component.reserveringenFromVoorstelling.set([
        makeReservering({ verificatie_status: 'verified' }),
      ]);

      expect(component.printableReserveringen()).toEqual([]);
    });

    it('only returns verified members', () => {
      component.sponsors.set([makeSponsor()]);
      const verified = makeReservering({
        id: 'verified',
        verificatie_status: 'verified',
      });
      const unverified = makeReservering({
        id: 'unverified',
        verificatie_status: 'unverified',
      });
      const noMembership = makeReservering({
        id: 'no-membership',
        is_lid_van_vereniging: false,
        is_vriend_van_tovedem: false,
        verificatie_status: 'verified',
      });
      component.reserveringenFromVoorstelling.set([
        verified,
        unverified,
        noMembership,
      ]);

      const result = component.printableReserveringen();

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('verified');
    });
  });

  describe('hasOrangeFlags', () => {
    it('is true for a member with tickets and a partial verification', () => {
      component.sponsors.set([makeSponsor()]);
      component.reserveringenFromVoorstelling.set([
        makeReservering({ verificatie_status: 'partial', datum_tijd_1_aantal: 1 }),
      ]);

      expect(component.hasOrangeFlags()).toBeTrue();
    });

    it('ignores partial reserveringen without tickets for the selected day', () => {
      component.sponsors.set([makeSponsor()]);
      component.reserveringenFromVoorstelling.set([
        makeReservering({ verificatie_status: 'partial', datum_tijd_1_aantal: 0 }),
      ]);

      expect(component.hasOrangeFlags()).toBeFalse();
    });
  });

  describe('getVerificationStatus', () => {
    it('respects a manually set status', () => {
      component.sponsors.set([makeSponsor()]);

      expect(
        component.getVerificationStatus(
          makeReservering({ verificatie_status: 'verified' }),
        ),
      ).toBe('verified');
      expect(
        component.getVerificationStatus(
          makeReservering({ verificatie_status: 'partial' }),
        ),
      ).toBe('partial');
    });

    it('returns verified for an exact sponsor match with membership', () => {
      component.sponsors.set([makeSponsor()]);

      expect(
        component.getVerificationStatus(
          makeReservering({ is_lid_van_vereniging: true }),
        ),
      ).toBe('verified');
    });

    it('returns verified_no_membership for an exact match without membership', () => {
      component.sponsors.set([makeSponsor()]);

      expect(
        component.getVerificationStatus(
          makeReservering({
            is_lid_van_vereniging: false,
            is_vriend_van_tovedem: false,
          }),
        ),
      ).toBe('verified_no_membership');
    });

    it('returns partial when only the name matches', () => {
      component.sponsors.set([makeSponsor({ email: 'iets@anders.nl' })]);

      expect(component.getVerificationStatus(makeReservering())).toBe('partial');
    });

    it('returns unverified for a member without any sponsor match', () => {
      component.sponsors.set([
        makeSponsor({ voornaam: 'Piet', achternaam: 'Pietersen' }),
      ]);

      expect(component.getVerificationStatus(makeReservering())).toBe(
        'unverified',
      );
    });

    it('returns unverified_no_membership without membership or match', () => {
      component.sponsors.set([
        makeSponsor({ voornaam: 'Piet', achternaam: 'Pietersen' }),
      ]);

      expect(
        component.getVerificationStatus(
          makeReservering({
            is_lid_van_vereniging: false,
            is_vriend_van_tovedem: false,
          }),
        ),
      ).toBe('unverified_no_membership');
    });
  });

  describe('ticket formatting', () => {
    it('capitalizes a surname that starts with a tussenvoegsel (current behaviour)', () => {
      // formatName() is applied to voornaam and achternaam separately and always
      // capitalizes its first part, so a surname starting with a tussenvoegsel is
      // printed as "Van der Berg" instead of the Dutch "van der Berg".
      expect(
        component.getReserveringTicketName(
          makeReservering({ voornaam: 'JAN', achternaam: 'VAN DER BERG' }),
        ),
      ).toBe('Jan Van der Berg');

      expect(
        component.getReserveringTicketName(
          makeReservering({ voornaam: 'jan', achternaam: 'van der berg' }),
        ),
      ).toBe('Jan Van der Berg');

      expect(
        component.getReserveringTicketName(
          makeReservering({ voornaam: 'Jan', achternaam: 'de Vries' }),
        ),
      ).toBe('Jan De Vries');
    });

    it('keeps a tussenvoegsel that is not the first surname part lowercase', () => {
      expect(
        component.getReserveringTicketName(
          makeReservering({ voornaam: 'Jan', achternaam: 'Jansen van Dijk' }),
        ),
      ).toBe('Jan Jansen van Dijk');
    });

    it('capitalizes a plain name', () => {
      expect(
        component.getReserveringTicketName(
          makeReservering({ voornaam: 'piet', achternaam: 'vries' }),
        ),
      ).toBe('Piet Vries');
    });

    it('labels the ticket with the membership type', () => {
      expect(
        component.getReserveringTicketStatus(
          makeReservering({ is_lid_van_vereniging: true }),
        ),
      ).toBe('Lid van Tovedem');

      expect(
        component.getReserveringTicketStatus(
          makeReservering({
            is_lid_van_vereniging: false,
            is_vriend_van_tovedem: true,
          }),
        ),
      ).toBe('Vriend van Tovedem');

      expect(
        component.getReserveringTicketStatus(
          makeReservering({
            is_lid_van_vereniging: false,
            is_vriend_van_tovedem: false,
          }),
        ),
      ).toBeNull();
    });
  });

  describe('voorstelling datum', () => {
    it('is empty without a selected voorstelling', () => {
      expect(component.getVoorstellingDatum()).toBe('');
    });

    it('formats the date of the selected day', () => {
      component.selectedVoorstelling.set(makeVoorstelling());
      component.selectedDay.set('datum2');

      expect(component.getVoorstellingDatum()).toBe('1 december 2026');
      expect(dateTimeServiceMock.formatDate).toHaveBeenCalledWith(
        '2026-12-02T19:00:00.000Z',
        'd LLLL yyyy',
        'nl',
      );
    });

    it('falls back to datum1 when the second date is missing', () => {
      component.selectedVoorstelling.set(
        makeVoorstelling({ datum_tijd_2: '' }),
      );
      component.selectedDay.set('datum2');

      component.getVoorstellingDatum();

      expect(dateTimeServiceMock.formatDate).toHaveBeenCalledWith(
        '2026-12-01T19:00:00.000Z',
        'd LLLL yyyy',
        'nl',
      );
    });
  });

  it('builds a list of the requested length', () => {
    expect(component.createListOfAmountOfItems(0).length).toBe(0);
    expect(component.createListOfAmountOfItems(4).length).toBe(4);
  });
});
