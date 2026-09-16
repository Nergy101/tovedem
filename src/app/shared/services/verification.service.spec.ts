import { VerificationService } from './verification.service';
import { Reservering } from '../../models/domain/reservering.model';
import { Sponsor } from '../../models/domain/sponsor.model';

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

describe('VerificationService', () => {
  let service: VerificationService;

  beforeEach(() => {
    service = new VerificationService();
  });

  describe('manually set status', () => {
    it('respects a manual partial status instead of recalculating it', () => {
      // Regression: a manual "partial" used to fall through to the automatic
      // calculation, which could mark the reservering as "verified" (and thus
      // printable) even though an admin had marked it as only partially matched.
      const result = service.checkVerificationStatus(
        makeReservering({ verificatie_status: 'partial' }),
        [makeSponsor()],
      );

      expect(result.status).toBe('partial');
    });

    it('respects a manual verified status and returns the matched sponsor', () => {
      const sponsor = makeSponsor({ id: 'sp-9' });
      const result = service.checkVerificationStatus(
        makeReservering({
          verificatie_status: 'verified',
          verificatie_sponsor_id: 'sp-9',
        }),
        [sponsor],
      );

      expect(result.status).toBe('verified');
      expect(result.matchingSponsors).toEqual([sponsor]);
    });

    it('respects the remaining manual statuses', () => {
      expect(
        service.checkVerificationStatus(
          makeReservering({ verificatie_status: 'verified_no_membership' }),
          [makeSponsor()],
        ).status,
      ).toBe('verified_no_membership');
      expect(
        service.checkVerificationStatus(
          makeReservering({ verificatie_status: 'unverified' }),
          [makeSponsor()],
        ).status,
      ).toBe('unverified');
      expect(
        service.checkVerificationStatus(
          makeReservering({ verificatie_status: 'unverified_no_membership' }),
          [makeSponsor()],
        ).status,
      ).toBe('unverified_no_membership');
    });
  });

  describe('automatic status', () => {
    it('is verified for an exact match with membership', () => {
      expect(
        service.checkVerificationStatus(makeReservering(), [makeSponsor()]).status,
      ).toBe('verified');
    });

    it('is partial when only the name matches', () => {
      expect(
        service.checkVerificationStatus(makeReservering(), [
          makeSponsor({ email: 'iets@anders.nl' }),
        ]).status,
      ).toBe('partial');
    });

    it('is unverified for a member without a match', () => {
      expect(
        service.checkVerificationStatus(makeReservering(), [
          makeSponsor({ voornaam: 'Piet', achternaam: 'Pietersen' }),
        ]).status,
      ).toBe('unverified');
    });

    it('is unverified_no_membership without membership and without a match', () => {
      expect(
        service.checkVerificationStatus(
          makeReservering({
            is_lid_van_vereniging: false,
            is_vriend_van_tovedem: false,
          }),
          [makeSponsor({ voornaam: 'Piet', achternaam: 'Pietersen' })],
        ).status,
      ).toBe('unverified_no_membership');
    });

    it('does not verify on email alone', () => {
      expect(
        service.checkVerificationStatus(makeReservering(), [
          makeSponsor({ voornaam: 'Piet', achternaam: 'Pietersen' }),
        ]).status,
      ).toBe('unverified');
    });

    it('matches partially on a shared email domain', () => {
      expect(
        service.emailsMatch('jan@example.com', 'iemand@example.com'),
      ).toBeTrue();
      expect(service.emailsMatch('jan@example.com', 'jan@anders.nl')).toBeTrue();
      expect(service.emailsMatch('jan@example.com', 'piet@anders.nl')).toBeFalse();
    });
  });
});
