import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Reservering } from '../../../models/domain/reservering.model';
import { Sponsor } from '../../../models/domain/sponsor.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { jsPDF } from 'jspdf';

interface CustomName {
  name: string;
  quantity: number;
}

@Component({
  selector: 'app-printen',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDivider,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatButtonToggleModule,
    FormsModule,
    DatePipe,
    RouterModule,
  ],
  templateUrl: './printen.component.html',
  styleUrl: './printen.component.scss',
})
export class PrintenComponent implements OnInit {
  titleService = inject(Title);
  seoService = inject(SeoService);
  client = inject(PocketbaseService);
  router = inject(Router);
  toastr = inject(ToastrService);

  kinderenQuantity = signal(0);
  vriendVanTovedemQuantity = signal(0);
  sponsoringQuantity = signal(0);
  customNames: WritableSignal<CustomName[]> = signal([]);

  newCustomName = signal('');
  newCustomQuantity = signal(1);
  generatingPdf = signal(false);

  // Voorstelling and reserveringen signals
  voorstellingen: WritableSignal<Voorstelling[]> = signal([]);
  selectedVoorstelling = signal<Voorstelling | null>(null);
  selectedDay = signal<'datum1' | 'datum2'>('datum1');
  reserveringenFromVoorstelling: WritableSignal<Reservering[]> = signal([]);
  loadingReserveringen = signal(false);
  sponsors = signal<Sponsor[]>([]);

  // Filtered reserveringen for printing (lid OR vriend + verified)
  // Note: Requires either lid OR vriend (or both) to be true for printing
  printableReserveringen = computed(() => {
    // Ensure sponsors are loaded before computing status
    const sponsors = this.sponsors();
    if (sponsors.length === 0) {
      // Sponsors not loaded yet, return empty array to avoid incorrect status calculations
      return [];
    }

    return this.reserveringenFromVoorstelling().filter((reservering) => {
      // Must be either lid OR vriend (or both)
      if (
        !reservering.is_lid_van_vereniging &&
        !reservering.is_vriend_van_tovedem
      ) {
        return false;
      }

      // Must have verified status (green flag)
      const status = this.getVerificationStatus(reservering);
      return status === 'verified';
    });
  });

  // Check if there are any orange flags (partial verification)
  // Only checks reserveringen that would actually be printed (have tickets for selected day and meet membership requirements)
  hasOrangeFlags = computed(() => {
    // Ensure sponsors are loaded before computing status
    const sponsors = this.sponsors();
    if (sponsors.length === 0) {
      // Sponsors not loaded yet, return false to avoid blocking printing incorrectly
      return false;
    }

    const selectedDay = this.selectedDay();
    return this.reserveringenFromVoorstelling().some((reservering) => {
      // Check if this reservering has tickets for the selected day
      const amount =
        selectedDay === 'datum1'
          ? reservering.datum_tijd_1_aantal
          : reservering.datum_tijd_2_aantal;

      if (amount === 0) return false;

      // Must be either lid OR vriend (or both) to be considered (same as printableReserveringen filter)
      if (
        !reservering.is_lid_van_vereniging &&
        !reservering.is_vriend_van_tovedem
      ) {
        return false;
      }

      // Check if status is partial (orange)
      const status = this.getVerificationStatus(reservering);
      return status === 'partial';
    });
  });

  constructor() {
    this.titleService.setTitle('Tovedem - Printen');
    this.seoService.update('Tovedem - Printen');

    // Effect to load reserveringen when voorstelling or day changes
    effect(() => {
      const selectedVoorstelling = this.selectedVoorstelling();
      const selectedDay = this.selectedDay();

      if (!selectedVoorstelling) {
        this.reserveringenFromVoorstelling.set([]);
        return;
      }

      this.loadingReserveringen.set(true);
      this.client.directClient
        .collection('reserveringen')
        .getFullList({
          filter: this.client.directClient.filter(
            'voorstelling.id = {:voorstellingId}',
            {
              voorstellingId: selectedVoorstelling.id,
            }
          ),
        })
        .then((reserveringen) => {
          this.reserveringenFromVoorstelling.set(
            reserveringen as unknown as Reservering[]
          );
          this.loadingReserveringen.set(false);
        })
        .catch(() => {
          this.loadingReserveringen.set(false);
        });
    });
  }

  async ngOnInit(): Promise<void> {
    this.voorstellingen.set(
      await this.client.directClient.collection('voorstellingen').getFullList({
        sort: '-datum_tijd_1',
        filter: 'gearchiveerd != true',
      })
    );

    // Load sponsors for verification checking
    this.sponsors.set(
      await this.client.directClient.collection('sponsoren').getFullList()
    );
  }

  incrementKinderen(): void {
    this.kinderenQuantity.update((val) => val + 1);
  }

  decrementKinderen(): void {
    if (this.kinderenQuantity() > 0) {
      this.kinderenQuantity.update((val) => val - 1);
    }
  }

  incrementVriend(): void {
    this.vriendVanTovedemQuantity.update((val) => val + 1);
  }

  decrementVriend(): void {
    if (this.vriendVanTovedemQuantity() > 0) {
      this.vriendVanTovedemQuantity.update((val) => val - 1);
    }
  }

  incrementSponsoring(): void {
    this.sponsoringQuantity.update((val) => val + 1);
  }

  decrementSponsoring(): void {
    if (this.sponsoringQuantity() > 0) {
      this.sponsoringQuantity.update((val) => val - 1);
    }
  }

  addCustomName(): void {
    const name = this.newCustomName().trim();
    const quantity = this.newCustomQuantity();
    if (name && quantity > 0) {
      this.customNames.update((names) => [...names, { name, quantity }]);
      this.newCustomName.set('');
      this.newCustomQuantity.set(1);
    }
  }

  removeCustomName(index: number): void {
    this.customNames.update((names) => names.filter((_, i) => i !== index));
  }

  incrementCustomQuantity(index: number): void {
    this.customNames.update((names) => {
      const updated = [...names];
      updated[index].quantity++;
      return updated;
    });
  }

  decrementCustomQuantity(index: number): void {
    this.customNames.update((names) => {
      const updated = [...names];
      if (updated[index].quantity > 0) {
        updated[index].quantity--;
      }
      return updated;
    });
  }

  updateCustomQuantity(index: number, quantity: number): void {
    this.customNames.update((names) => {
      const updated = [...names];
      updated[index].quantity = quantity;
      return updated;
    });
  }

  createListOfAmountOfItems(amountOfItems: number): unknown[] {
    const list: unknown[] = [];
    for (let index = 0; index < amountOfItems; index++) {
      list.push({});
    }
    return list;
  }

  get hasTickets(): boolean {
    const hasManualTickets =
      this.kinderenQuantity() > 0 ||
      this.vriendVanTovedemQuantity() > 0 ||
      this.sponsoringQuantity() > 0 ||
      this.customNames().some((cn) => cn.quantity > 0);

    const hasReserveringenTickets = this.printableReserveringen().some(
      (reservering) => {
        const amount =
          this.selectedDay() === 'datum1'
            ? reservering.datum_tijd_1_aantal
            : reservering.datum_tijd_2_aantal;
        return amount > 0;
      }
    );

    return hasManualTickets || hasReserveringenTickets;
  }

  setSelectedVoorstelling(event: MatSelectChange): void {
    this.selectedVoorstelling.set(event.value);
  }

  setSelectedDay(event: MatButtonToggleChange): void {
    this.selectedDay.set(event.value);
  }

  /**
   * Get formatted voorstelling date for display in preview
   */
  getVoorstellingDatum(): string {
    const selectedVoorstelling = this.selectedVoorstelling();
    if (!selectedVoorstelling) return '';

    const selectedDayValue = this.selectedDay();
    const datumString =
      selectedDayValue === 'datum1'
        ? selectedVoorstelling.datum_tijd_1
        : selectedVoorstelling.datum_tijd_2 || selectedVoorstelling.datum_tijd_1;

    return this.formatDutchDate(datumString);
  }

  /**
   * Format name with pascal casing, handling Dutch tussenvoegsels correctly
   * Tussenvoegsels (de, van, den, der, van der, etc.) remain lowercase
   */
  private formatName(name: string): string {
    if (!name) return '';

    // Dutch tussenvoegsels that should remain lowercase
    const tussenvoegsels = [
      'van',
      'de',
      'den',
      'der',
      'het',
      'ten',
      'ter',
      'te',
      "'t",
      "'s",
      'van der',
      'van den',
      'van de',
      'de la',
      'du',
      'le',
    ];

    // Split name into parts
    const parts = name.trim().split(/\s+/);

    // Check for multi-word tussenvoegsels first (like "van der")
    const processedParts: string[] = [];
    let i = 0;
    while (i < parts.length) {
      // Check for two-word tussenvoegsels
      if (
        i < parts.length - 1 &&
        tussenvoegsels.includes(`${parts[i]} ${parts[i + 1]}`.toLowerCase())
      ) {
        processedParts.push(`${parts[i]} ${parts[i + 1]}`.toLowerCase());
        i += 2;
      } else {
        processedParts.push(parts[i]);
        i++;
      }
    }

    return processedParts
      .map((part, index) => {
        const lowerPart = part.toLowerCase();
        const isTussenvoegsel = tussenvoegsels.includes(lowerPart);

        // First part always capitalized
        if (index === 0) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }

        // Tussenvoegsels remain lowercase
        if (isTussenvoegsel) {
          return lowerPart;
        }

        // Last part (after tussenvoegsels) should be capitalized
        // Check if previous part was a tussenvoegsel
        const prevPart = processedParts[index - 1]?.toLowerCase() || '';
        const prevWasTussenvoegsel = tussenvoegsels.includes(prevPart);

        // If previous was tussenvoegsel, capitalize this part
        if (prevWasTussenvoegsel) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }

        // Otherwise capitalize normally
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(' ');
  }

  getReserveringTicketName(reservering: Reservering): string {
    const formattedVoornaam = this.formatName(reservering.voornaam);
    const formattedAchternaam = this.formatName(reservering.achternaam);
    return `${formattedVoornaam} ${formattedAchternaam}`;
  }

  getReserveringTicketStatus(reservering: Reservering): string | null {
    if (reservering.is_lid_van_vereniging) {
      return 'Lid van Tovedem';
    } else if (reservering.is_vriend_van_tovedem) {
      return 'Vriend van Tovedem';
    }
    return null;
  }

  /**
   * Format date to Dutch notation (e.g., "15 maart 2024")
   */
  private formatDutchDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
      'januari',
      'februari',
      'maart',
      'april',
      'mei',
      'juni',
      'juli',
      'augustus',
      'september',
      'oktober',
      'november',
      'december',
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  /**
   * Normalize string for comparison (trim, lowercase)
   */
  private normalize(str: string): string {
    return (str || '').trim().toLowerCase();
  }

  /**
   * Check if emails match (exact or partial - same domain or username)
   */
  private emailsMatch(email1: string, email2: string): boolean {
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
   * Get verification status for a reservation
   * Returns: 'verified' | 'partial' | 'unverified' | 'verified_no_membership' | 'unverified_no_membership'
   */
  getVerificationStatus(
    reservering: Reservering
  ):
    | 'verified'
    | 'partial'
    | 'unverified'
    | 'verified_no_membership'
    | 'unverified_no_membership' {
    // If manually verified/unverified, respect that
    if (reservering.verificatie_status === 'verified') {
      return 'verified';
    }
    if (reservering.verificatie_status === 'verified_no_membership') {
      return 'verified_no_membership';
    }
    if (reservering.verificatie_status === 'unverified') {
      return 'unverified';
    }
    if (reservering.verificatie_status === 'unverified_no_membership') {
      return 'unverified_no_membership';
    }

    // Handle null/undefined verificatie_status - calculate automatically
    // But only if sponsors are loaded
    if (this.sponsors().length === 0) {
      // Sponsors not loaded yet, return unverified to be safe
      const hasMembership =
        reservering.is_vriend_van_tovedem || reservering.is_lid_van_vereniging;
      return hasMembership ? 'unverified' : 'unverified_no_membership';
    }

    const resVoornaam = this.normalize(reservering.voornaam);
    const resAchternaam = this.normalize(reservering.achternaam);
    const resEmail = this.normalize(reservering.email);

    const exactMatches: Sponsor[] = [];
    const partialMatches: Sponsor[] = [];

    for (const sponsor of this.sponsors()) {
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
        return 'verified_no_membership';
      }
      return 'verified';
    }

    if (partialMatches.length > 0) {
      return 'partial';
    }

    // No matches found - check membership status
    if (hasMembership) {
      // Red flag: has membership but no matches
      return 'unverified';
    } else {
      // Gray flag: no membership and no matches
      return 'unverified_no_membership';
    }
  }

  async testPdf(): Promise<void> {
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add "hello" text to the PDF
      doc.text('hello', 10, 10);

      // Save the PDF
      doc.save('test.pdf');
    } catch (error) {
      console.error('Error generating test PDF:', error);
    }
  }

  async printTickets(): Promise<void> {
    // Check for orange flags first - block printing if any exist
    if (this.hasOrangeFlags()) {
      this.toastr.error(
        'Er zijn reserveringen met oranje vlaggetjes. Los deze eerst op voordat je kunt printen.',
        'Kan niet printen',
        {
          timeOut: 10000,
          enableHtml: true,
        }
      );
      // Navigate to reserveringen page after a short delay
      setTimeout(() => {
        this.router.navigate(['/beheer-reserveringen'], {
          queryParams: this.selectedVoorstelling()
            ? { voorstellingId: this.selectedVoorstelling()!.id }
            : {},
        });
      }, 2000);
      return;
    }

    // Check if there are any tickets to print BEFORE setting generatingPdf
    if (!this.hasTickets) {
      this.toastr.warning(
        'Er zijn geen tickets om te printen. Voeg tickets toe en probeer het opnieuw.',
        'Geen tickets',
        {
          timeOut: 5000,
        }
      );
      return;
    }

    this.generatingPdf.set(true);

    try {
      // Load the logo image with error handling
      const logoPath = '/assets/tovedem_logo_klein.png';
      let logoDataUrl: string | null = null;
      let logoAspectRatio = 1; // Default to square
      try {
        logoDataUrl = await this.loadImageAsDataUrl(logoPath);
        // Get actual image dimensions to maintain aspect ratio
        const img = new Image();
        img.src = logoDataUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            logoAspectRatio = img.width / img.height;
            resolve(null);
          };
        });
      } catch (error) {
        console.error('Error loading logo image:', error);
        this.toastr.warning(
          'Het logo kon niet worden geladen. PDF wordt gegenereerd zonder logo.',
          'Logo fout',
          {
            timeOut: 5000,
          }
        );
        // Continue without logo - logoDataUrl will be null
      }

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 dimensions: 210mm x 297mm
      // 4 tickets per page: each ticket is exactly 74.25mm high (297mm / 4)
      const pageWidth = 210;
      const pageHeight = 297;
      const ticketHeight = pageHeight / 4; // 74.25mm per ticket (exactly)
      const sideMargin = 10; // Only side margins, no top/bottom margin
      const contentWidth = pageWidth - sideMargin * 2;
      // Logo dimensions: 180x118 pixels
      // Convert to mm (assuming 96 DPI for web images: 1 pixel = 0.264583mm)
      const logoWidth = 180 * 0.264583; // ≈ 47.6mm
      const logoHeight = 118 * 0.264583; // ≈ 31.2mm
      const logoMargin = 8; // Margin from edge (more space)

      let ticketIndex = 0;
      let currentY = 0; // Start at top of page, no top margin

      // Get voorstelling info for tickets
      const selectedVoorstelling = this.selectedVoorstelling();
      const selectedDayValue = this.selectedDay();
      let voorstellingTitel = '';
      let voorstellingDatum = '';

      if (selectedVoorstelling) {
        voorstellingTitel = selectedVoorstelling.titel;
        const datumString =
          selectedDayValue === 'datum1'
            ? selectedVoorstelling.datum_tijd_1
            : selectedVoorstelling.datum_tijd_2 ||
              selectedVoorstelling.datum_tijd_1;
        voorstellingDatum = this.formatDutchDate(datumString);
      }

      // Helper function to add a ticket
      const addTicket = (name: string) => {
        // Check if we need a new page (every 4 tickets)
        if (ticketIndex > 0 && ticketIndex % 4 === 0) {
          doc.addPage();
          currentY = 0; // Start at top of new page
        }

        // Draw ticket border
        doc.setDrawColor(200, 200, 200);
        doc.rect(sideMargin, currentY, contentWidth, ticketHeight);

        // Add logo on left side
        if (logoDataUrl) {
          doc.addImage(
            logoDataUrl,
            'PNG',
            sideMargin + logoMargin,
            currentY + (ticketHeight - logoHeight) / 2,
            logoWidth,
            logoHeight
          );
        }

        // Add logo on right side
        if (logoDataUrl) {
          doc.addImage(
            logoDataUrl,
            'PNG',
            sideMargin + contentWidth - logoWidth - logoMargin,
            currentY + (ticketHeight - logoHeight) / 2,
            logoWidth,
            logoHeight
          );
        }

        // Add ticket content (centered, accounting for logos)
        const textStartX = sideMargin + logoWidth + logoMargin * 2;
        const textWidth = contentWidth - (logoWidth + logoMargin * 2) * 2;

        // Better spacing and font sizes matching preview
        doc.setFontSize(14); // Preview h2 is 1.5em ≈ 14pt
        doc.setFont('helvetica', 'normal');
        doc.text(
          'Gereserveerd voor:',
          textStartX + textWidth / 2,
          currentY + 22,
          {
            align: 'center',
          }
        );

        // Parse name (remove status if present)
        const nameParts = name.split('\n');
        const displayName = nameParts[0];

        doc.setFontSize(24); // Preview h1 is 3em ≈ 24pt
        doc.setFont('helvetica', 'bold');
        doc.text(displayName, textStartX + textWidth / 2, currentY + 38, {
          align: 'center',
        });

        // Add voorstelling info at the bottom instead of status
        if (voorstellingTitel) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(
            voorstellingTitel,
            textStartX + textWidth / 2,
            currentY + 55,
            {
              align: 'center',
            }
          );
          
          if (voorstellingDatum) {
            doc.text(
              voorstellingDatum,
              textStartX + textWidth / 2,
              currentY + 62,
              {
                align: 'center',
              }
            );
          }
          
          doc.setTextColor(0, 0, 0); // Reset to black
        }

        // Move to next ticket position
        currentY += ticketHeight;
        ticketIndex++;
      };

      // Add Kinderen tickets
      for (let i = 0; i < this.kinderenQuantity(); i++) {
        addTicket('Kinderen');
      }

      // Add Organisatie tickets
      for (let i = 0; i < this.vriendVanTovedemQuantity(); i++) {
        addTicket('Organisatie');
      }

      // Add Blanco tickets
      for (let i = 0; i < this.sponsoringQuantity(); i++) {
        addTicket('__________');
      }

      // Add Custom name tickets
      for (const customName of this.customNames()) {
        for (let i = 0; i < customName.quantity; i++) {
          addTicket(`-${customName.name}-`);
        }
      }

      // Add Reserveringen tickets (only printable ones: lid + vriend + verified)
      const selectedDayForReserveringen = this.selectedDay();
      for (const reservering of this.printableReserveringen()) {
        const amount =
          selectedDayForReserveringen === 'datum1'
            ? reservering.datum_tijd_1_aantal
            : reservering.datum_tijd_2_aantal;

        // Only print if amount > 0 for selected day
        if (amount === 0) continue;

        const personName = this.getReserveringTicketName(reservering);
        for (let i = 0; i < amount; i++) {
          addTicket(personName);
        }
      }

      // Save the PDF
      doc.save('tovedem-tickets.pdf');
      this.toastr.success('PDF succesvol gegenereerd!', 'Gelukt', {
        timeOut: 3000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.toastr.error(
        'Er is een fout opgetreden bij het genereren van de PDF. Probeer het opnieuw.',
        'Fout bij genereren PDF',
        {
          timeOut: 8000,
        }
      );
    } finally {
      this.generatingPdf.set(false);
    }
  }

  private loadImageAsDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } else {
            reject(new Error('Could not get canvas context'));
          }
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }
}
