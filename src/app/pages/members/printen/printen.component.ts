import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { SeoService } from '../../../shared/services/seo.service';
import { jsPDF } from 'jspdf';

interface CustomName {
  name: string;
  quantity: number;
}

@Component({
  selector: 'app-printen',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDivider,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './printen.component.html',
  styleUrl: './printen.component.scss',
})
export class PrintenComponent {
  titleService = inject(Title);
  seoService = inject(SeoService);

  kinderenQuantity = signal(0);
  vriendVanTovedemQuantity = signal(0);
  sponsoringQuantity = signal(0);
  customNames: WritableSignal<CustomName[]> = signal([]);

  newCustomName = signal('');
  newCustomQuantity = signal(1);
  generatingPdf = signal(false);

  constructor() {
    this.titleService.setTitle('Tovedem - Printen');
    this.seoService.update('Tovedem - Printen');
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
    return (
      this.kinderenQuantity() > 0 ||
      this.vriendVanTovedemQuantity() > 0 ||
      this.sponsoringQuantity() > 0 ||
      this.customNames().some((cn) => cn.quantity > 0)
    );
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

        doc.setFontSize(20);
        doc.text(name, textStartX + textWidth / 2, currentY + 35, {
          align: 'center',
        });

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
