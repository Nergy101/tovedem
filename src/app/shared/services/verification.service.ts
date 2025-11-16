import { Injectable } from '@angular/core';
import { Reservering } from '../../models/domain/reservering.model';
import { Sponsor } from '../../models/domain/sponsor.model';

export type VerificationStatus =
  | 'verified'
  | 'partial'
  | 'unverified'
  | 'verified_no_membership'
  | 'unverified_no_membership';

export interface VerificationResult {
  status: VerificationStatus;
  matchingSponsors: Sponsor[];
}

@Injectable({
  providedIn: 'root',
})
export class VerificationService {
  /**
   * Normalize string for comparison (trim, lowercase)
   */
  normalize(str: string): string {
    return (str || '').trim().toLowerCase();
  }

  /**
   * Check if emails match (exact or partial - same domain or username)
   */
  emailsMatch(email1: string, email2: string): boolean {
    const norm1 = this.normalize(email1);
    const norm2 = this.normalize(email2);

    if (!norm1 || !norm2) return false;

    // Exact match
    if (norm1 === norm2) return true;

    // Partial match: same domain or same username
    const [user1, domain1] = norm1.split('@');
    const [user2, domain2] = norm2.split('@');

    if (domain1 && domain2 && domain1 === domain2) return true;
    if (user1 && user2 && user1 === user2) return true;

    return false;
  }

  /**
   * Check verification status for a reservation
   * Returns: 'verified' | 'partial' | 'unverified' and matching sponsors
   */
  checkVerificationStatus(
    reservering: Reservering,
    sponsors: Sponsor[]
  ): VerificationResult {
    // If manually verified/unverified, respect that
    if (reservering.verificatie_status === 'verified') {
      const sponsor = sponsors.find(
        (s) => s.id === reservering.verificatie_sponsor_id
      );
      return {
        status: 'verified',
        matchingSponsors: sponsor ? [sponsor] : [],
      };
    }
    if (reservering.verificatie_status === 'verified_no_membership') {
      const sponsor = sponsors.find(
        (s) => s.id === reservering.verificatie_sponsor_id
      );
      return {
        status: 'verified_no_membership',
        matchingSponsors: sponsor ? [sponsor] : [],
      };
    }
    if (reservering.verificatie_status === 'unverified') {
      return {
        status: 'unverified',
        matchingSponsors: [],
      };
    }
    if (reservering.verificatie_status === 'unverified_no_membership') {
      return {
        status: 'unverified_no_membership',
        matchingSponsors: [],
      };
    }

    const resVoornaam = this.normalize(reservering.voornaam);
    const resAchternaam = this.normalize(reservering.achternaam);
    const resEmail = this.normalize(reservering.email);

    const exactMatches: Sponsor[] = [];
    const partialMatches: Sponsor[] = [];

    for (const sponsor of sponsors) {
      const spVoornaam = this.normalize(sponsor.voornaam);
      const spAchternaam = this.normalize(sponsor.achternaam);
      const spEmail = this.normalize(sponsor.email);

      const voornaamMatch = resVoornaam === spVoornaam;
      const achternaamMatch = resAchternaam === spAchternaam;
      const emailMatch = this.emailsMatch(reservering.email, sponsor.email);

      // Exact match: all three match
      if (voornaamMatch && achternaamMatch && emailMatch) {
        exactMatches.push(sponsor);
      }
      // Partial match: only name matches (voornaam OR achternaam), but not email-only matches
      else if (voornaamMatch || achternaamMatch) {
        partialMatches.push(sponsor);
      }
    }

    // Check membership status (used for both exact matches and no matches)
    const hasMembership =
      reservering.is_vriend_van_tovedem || reservering.is_lid_van_vereniging;

    if (exactMatches.length > 0) {
      // If exact match but no membership, return verified_no_membership
      if (!hasMembership) {
        return {
          status: 'verified_no_membership',
          matchingSponsors: exactMatches,
        };
      }
      return {
        status: 'verified',
        matchingSponsors: exactMatches,
      };
    }

    if (partialMatches.length > 0) {
      return {
        status: 'partial',
        matchingSponsors: partialMatches,
      };
    }

    // No matches found - check membership status

    if (hasMembership) {
      // Red flag: has membership but no matches
      return {
        status: 'unverified',
        matchingSponsors: [],
      };
    } else {
      // Gray flag: no membership and no matches
      return {
        status: 'unverified_no_membership',
        matchingSponsors: [],
      };
    }
  }

  /**
   * Get verification status for a reservation (computed)
   */
  getVerificationStatus(
    reservering: Reservering,
    sponsors: Sponsor[]
  ): VerificationStatus {
    return this.checkVerificationStatus(reservering, sponsors).status;
  }

  /**
   * Get all potential matching sponsors for a reservation (for dialog display)
   */
  getAllMatchingSponsors(
    reservering: Reservering,
    sponsors: Sponsor[]
  ): Sponsor[] {
    const resVoornaam = this.normalize(reservering.voornaam);
    const resAchternaam = this.normalize(reservering.achternaam);
    const allMatchingSponsors: Sponsor[] = [];

    for (const sponsor of sponsors) {
      const spVoornaam = this.normalize(sponsor.voornaam);
      const spAchternaam = this.normalize(sponsor.achternaam);

      const voornaamMatch = resVoornaam === spVoornaam;
      const achternaamMatch = resAchternaam === spAchternaam;

      // Include sponsors where name matches (for manual selection)
      if (voornaamMatch || achternaamMatch) {
        allMatchingSponsors.push(sponsor);
      }
    }

    return allMatchingSponsors;
  }
}

