import {
  Component,
  Inject,
  WritableSignal,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatLine } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { debounceTime, lastValueFrom, pipe, tap } from 'rxjs';
import Reservering from '../../../models/domain/resservering.model';
import Voorstelling from '../../../models/domain/voorstelling.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ReserveringEditDialogComponent } from './reserveringen-edit-dialog/reservering-edit-dialog.component';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';



@Component({
  selector: 'app-beheer-reserveringen',
  standalone: true,
  imports: [
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatLine,
    MatDivider,
    MatProgressBarModule,
    MatPaginatorModule,
    MatSelect,
    MatOption,
    MatMenuModule,
  ],
  templateUrl: './beheer-reserveringen.component.html',
  styleUrl: './beheer-reserveringen.component.scss',
})
export class BeheerReserveringenComponent {
  loading = signal(false);
  searching = signal(false)
  items: WritableSignal<any[] | null> = signal(null);
  client = inject(PocketbaseService);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);
  dialog = inject(MatDialog);

  authService = inject(AuthService);
  titleService = inject(Title);
  range = Array.from({ length: 5 }, (_, i) => i); // Creates [0, 1, 2, 3, 4]

  printItems: WritableSignal<any[] | null> = signal(null);
  voorstellingen: WritableSignal<any[] | null> = signal(null);
  selectedVoorstelling: any;
  selecting = signal(false);
  selectTerm = signal('');
  selectTerm$ = toObservable(this.selectTerm);
  nothingSelected = true;

  selectedDatum: any;

  kidsLabels: number = 0; // Initial amount value


  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Reserveringen');
    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async (newSearchTerm: string) => {
        if (!newSearchTerm || newSearchTerm == '') {
          this.items.set(
            await this.client.getAll<Reservering>('reserveringen', {
              expand: 'voorstelling',
            })
          );
        } else {
          this.items.set(
            await this.client.getAll<Reservering>('reserveringen', {
              expand: 'voorstelling',
              filter: this.client.client.filter(
                'email ~ {:search} || voornaam ~ {:search} || achternaam ~ {:search} || voorstelling.titel ~ {:search}',
                {
                  search: newSearchTerm,
                }
              ),
            })
          );
        }

        this.searching.set(false);
      });

    this.selectTerm$
      .pipe(
        tap(() => this.selecting.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async (newSelectTerm: string) => {
        if (!newSelectTerm || newSelectTerm == '') {
          this.nothingSelected = true;
        } else {
          this.nothingSelected = false;
          this.printItems.set(
            await this.client.getAll<Reservering>('reserveringen', {
              expand: 'voorstelling',
              filter: this.client.client.filter(
                'voorstelling.titel ~ {:select}',
                {
                  select: this.selectedVoorstelling.titel,
                }
              ),
            })
          );
        }
        this.selecting.set(false);
      });

  }

  async ngOnInit(): Promise<void> {
    this.voorstellingen.set(await this.client.getAll<Voorstelling>('voorstellingen'));
  }

  async delete({ id }: any) {
    this.loading.set(true);

    if (await this.client.delete('reserveringen', id)) {
      this.items.update((x) => x!.filter((y: any) => y.id != id));
    }

    this.loading.set(false);
  }

  async openEditDialog(reservering: Reservering) {
    const dialogRef = this.dialog.open(ReserveringEditDialogComponent, {
      data: { reservering },
      hasBackdrop: true,
    });

    await lastValueFrom(dialogRef.afterClosed());
    this.items.set(
      await this.client.getAll<Reservering>('reserveringen', {
        expand: 'voorstelling',
      })
    );
  }

  onSearchTermChanged(newValue: string) {
    this.searchTerm.set(newValue);
  }
  onSelectTermChanged(newValue: any) {
    this.selectTerm.set(newValue);
    this.selectedVoorstelling.set(newValue);
  }






  increment() {
    this.kidsLabels++;
  }

  decrement() {
    if (this.kidsLabels > 0) { // Optional: prevent negative values
      this.kidsLabels--;
    }
  }

  onAmountChange() {
    // Ensure amount is a valid number
    if (isNaN(this.kidsLabels)) {
      this.kidsLabels = 0;
    }
  }

  printen() {
    // Get the element by ID
    const element = document.getElementById('printSection');

    // Check if the element exists
    if (element) {
      // Configure the PDF options
      const options = {
        margin: 1,
        filename: 'Stoelreservering labels -datum voorstelling-.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },  // Increase scale for higher resolution
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      // Generate the PDF
      //html2pdf().from(element).set(options).save();
    } else {
      console.error("Element not found");
    }
  }
}
