import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
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
import { Reservering } from '../../../models/domain/reservering.model';
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
  ],
  templateUrl: './printen.component.html',
  styleUrl: './printen.component.scss',
})
export class PrintenComponent implements OnInit {
  titleService = inject(Title);
  seoService = inject(SeoService);
  client = inject(PocketbaseService);

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
      this.client
        .getAll<Reservering>('reserveringen', {
          filter: this.client.client.filter(
            'voorstelling.id = {:voorstellingId}',
            {
              voorstellingId: selectedVoorstelling.id,
            }
          ),
        })
        .then((reserveringen) => {
          this.reserveringenFromVoorstelling.set(reserveringen);
          this.loadingReserveringen.set(false);
        })
        .catch(() => {
          this.loadingReserveringen.set(false);
        });
    });
  }

  async ngOnInit(): Promise<void> {
    this.voorstellingen.set(
      await this.client.getAll<Voorstelling>('voorstellingen', {
        sort: '-datum_tijd_1',
      })
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

    const hasReserveringenTickets = this.reserveringenFromVoorstelling().some(
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

  getReserveringTicketName(reservering: Reservering): string {
    return `${reservering.voornaam} ${reservering.achternaam}`;
  }

  getReserveringTicketStatus(reservering: Reservering): string | null {
    if (reservering.is_lid_van_vereniging) {
      return 'Lid van Tovedem';
    } else if (reservering.is_vriend_van_tovedem) {
      return 'Vriend van Tovedem';
    }
    return null;
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
    this.generatingPdf.set(true);

    try {
      // Check if there are any tickets to print
      if (!this.hasTickets) {
        console.error('No tickets found to print');
        return;
      }

      // Load the logo image
      const logoPath = '/assets/tovedem_logo_klein.png';
      const logoDataUrl = await this.loadImageAsDataUrl(logoPath);

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 dimensions: 210mm x 297mm
      // 4 tickets per page: each ticket is 74.25mm high (297mm / 4)
      const pageWidth = 210;
      const pageHeight = 297;
      const ticketHeight = pageHeight / 4; // 74.25mm per ticket
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const logoSize = 30; // Logo size in mm
      const logoMargin = 5; // Margin from edge

      let ticketIndex = 0;
      let currentY = margin;

      // Helper function to add a ticket
      const addTicket = (name: string) => {
        // Check if we need a new page (every 4 tickets)
        if (ticketIndex > 0 && ticketIndex % 4 === 0) {
          doc.addPage();
          currentY = margin;
        }

        // Draw ticket border
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, currentY, contentWidth, ticketHeight - 2);

        // Add logo on left side
        if (logoDataUrl) {
          doc.addImage(
            logoDataUrl,
            'PNG',
            margin + logoMargin,
            currentY + (ticketHeight - logoSize) / 2,
            logoSize,
            logoSize
          );
        }

        // Add logo on right side
        if (logoDataUrl) {
          doc.addImage(
            logoDataUrl,
            'PNG',
            margin + contentWidth - logoSize - logoMargin,
            currentY + (ticketHeight - logoSize) / 2,
            logoSize,
            logoSize
          );
        }

        // Add ticket content (centered, accounting for logos)
        const textStartX = margin + logoSize + logoMargin * 2;
        const textWidth = contentWidth - (logoSize + logoMargin * 2) * 2;

        doc.setFontSize(12);
        doc.text(
          'Gereserveerd voor:',
          textStartX + textWidth / 2,
          currentY + 20,
          {
            align: 'center',
          }
        );

        // Parse name and status if they're separated by newline
        const nameParts = name.split('\n');
        const displayName = nameParts[0];
        const status = nameParts.length > 1 ? nameParts[1] : null;

        doc.setFontSize(20);
        doc.text(displayName, textStartX + textWidth / 2, currentY + 35, {
          align: 'center',
        });

        // Add status on second row if present
        if (status) {
          doc.setFontSize(14);
          doc.text(status, textStartX + textWidth / 2, currentY + 50, {
            align: 'center',
          });
        }

        // Move to next ticket position
        currentY += ticketHeight;
        ticketIndex++;
      };

      // Add Kinderen tickets
      for (let i = 0; i < this.kinderenQuantity(); i++) {
        addTicket('-Kinderen-');
      }

      // Add Vriend van tovedem tickets
      for (let i = 0; i < this.vriendVanTovedemQuantity(); i++) {
        addTicket('-Vriend van tovedem-');
      }

      // Add Sponsoring tickets
      for (let i = 0; i < this.sponsoringQuantity(); i++) {
        addTicket('-Sponsoring-');
      }

      // Add Custom name tickets
      for (const customName of this.customNames()) {
        for (let i = 0; i < customName.quantity; i++) {
          addTicket(`-${customName.name}-`);
        }
      }

      // Add Reserveringen tickets
      const selectedDay = this.selectedDay();
      for (const reservering of this.reserveringenFromVoorstelling()) {
        const amount =
          selectedDay === 'datum1'
            ? reservering.datum_tijd_1_aantal
            : reservering.datum_tijd_2_aantal;
        const personName = this.getReserveringTicketName(reservering);
        const status = this.getReserveringTicketStatus(reservering);
        const ticketName = status ? `${personName}\n${status}` : personName;
        for (let i = 0; i < amount; i++) {
          addTicket(ticketName);
        }
      }

      // Save the PDF
      doc.save('tovedem-tickets.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
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
