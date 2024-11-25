import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ChartOptions, PieChartComponent } from './pie-chart/pie-chart.component';

@Component({
  selector: 'app-reserveringen-inzien',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    DatePipe,
    MatExpansionModule,
    PieChartComponent
  ],
  templateUrl: './reserveringen-inzien.component.html',
  styleUrl: './reserveringen-inzien.component.scss'
})
export class ReserveringenInzienComponent implements OnInit {

  loading = signal(false);
  searching = signal(false)
  client = inject(PocketbaseService);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);
  voorstellingen = signal<Voorstelling[]>([]);

  selectedVoorstelling = signal<Voorstelling | null>(null);
  reserveringenOfSelectedVoorstelling = signal<Reservering[]>([]);



  constructor() {
    // set Reserveringen Of Voorstelling
    effect(async () => {
      const selectedVoorstelling = this.selectedVoorstelling()

      if (!selectedVoorstelling) return;

      const reserveringen =
        await this.client.getAll<Reservering>("reserveringen",
          {
            filter: this.client.client.filter(
              'voorstelling.id = {:voorstellingId}', {
              voorstellingId: selectedVoorstelling.id
            }
            )
          });

      console.log("reserveringen", reserveringen)

      this.reserveringenOfSelectedVoorstelling.set(reserveringen)
    }, { allowSignalWrites: true })
  }

  async ngOnInit(): Promise<void> {
    this.voorstellingen.set(await this.client.getAll<Voorstelling>("voorstellingen", {
      sort: '-datum_tijd_1'
    }))
  }

  setSelectedVoorstelling(event: MatSelectChange): void {
    this.selectedVoorstelling.set(event.value)
  }

  getChartOptionsDatum2(): ChartOptions {
    let aantalGereserveerdDatum2 = 0;
    let aantalVrijDatum2 = 80;

    this.reserveringenOfSelectedVoorstelling().forEach((reservering) => {
      aantalGereserveerdDatum2 += reservering.datum_tijd_2_aantal;
      aantalVrijDatum2 -= reservering.datum_tijd_2_aantal;
    })

    return {
      series: [aantalGereserveerdDatum2, aantalVrijDatum2],
      chart: {
        width: 380,
        type: "pie"
      },
      labels: ["Gereserveerd", "Vrij"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    }
  }

  seriesDatum1 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();

    const gereserveerd = reserveringen.reduce((acc, reservering) => acc + reservering.datum_tijd_1_aantal, 0)
    const vrij = reserveringen.reduce((acc, reservering) => acc - reservering.datum_tijd_1_aantal, 80)

    return [gereserveerd, vrij];
  })

  seriesDatum2 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();

    const gereseveerd = reserveringen.reduce((acc, reservering) => acc + reservering.datum_tijd_2_aantal, 0)
    const vrij = reserveringen.reduce((acc, reservering) => acc - reservering.datum_tijd_2_aantal, 80)

    return [gereseveerd, vrij];
  })

  labelsDatum1 = computed<string[]>(() => {
    const gereserveerd = this.seriesDatum1()[0];
    const vrij = this.seriesDatum1()[1];

    return [`Gereserveerd: ${gereserveerd}`, `Vrij ${vrij}`]
  })

  labelsDatum2 = computed<string[]>(() => {

    const gereserveerd = this.seriesDatum2()[0];
    const vrij = this.seriesDatum2()[1];

    return [`Gereserveerd: ${gereserveerd}`, `Vrij ${vrij}`]
  })

}
