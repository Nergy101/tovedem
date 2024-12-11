import {
  Component,
  WritableSignal,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatLine, MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { debounceTime, lastValueFrom, tap } from 'rxjs';
import { Reservering } from '../../../models/domain/reservering.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ReserveringEditDialogComponent } from './reserveringen-edit-dialog/reservering-edit-dialog.component';
import { ReserveringenInzienComponent } from './reserveringen-inzien/reserveringen-inzien.component';



@Component({
    selector: 'app-beheer-reserveringen',
    imports: [
        MatCheckboxModule,
        MatIconModule,
        MatButtonModule,
        MatTabsModule,
        MatProgressSpinnerModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        MatDivider,
        MatProgressBarModule,
        MatPaginatorModule,
        MatSelect,
        MatOption,
        MatMenuModule,
        ReserveringenInzienComponent
    ],
    templateUrl: './beheer-reserveringen.component.html',
    styleUrl: './beheer-reserveringen.component.scss'
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

  selectedVoorstelling: WritableSignal<any | null> = signal(null);
  reserveringenVanVoorstelling: WritableSignal<any[] | null> = signal(null);

  selecting = signal(false);
  selectTerm = signal('');
  selectTerm$ = toObservable(this.selectTerm);
  nothingSelected = true;

  selectedDatum: WritableSignal<string | null> = signal(null);
  beschikbareDatums = ["Datum 1", "Datum 2"]

  kidsLabels: number = 1; // Initial amount value

  createListOfAmountOfItems(amountOfItems: number) {
    // console.log('received createlist for items:', amountOfItems)
    let list: any[] = []

    for (let index = 0; index < amountOfItems; index++) {
      list.push({})
    }

    // console.log(list)
    return list
  }

  get isPrintEnabled() {
    return !!this.selectedVoorstelling();
  }

  amountOfItemsForReservation(reservering: any) {
    return this.selectedDatum() ==
      "Datum 1" ? reservering.datum_tijd_1_aantal :
      reservering.datum_tijd_2_aantal
  }

  get formattedSelectedDate(): string | null {
    const dateString = (this.selectedDatum() == "Datum 1" ?
      this.selectedVoorstelling()?.datum_tijd_1 :
      this.selectedVoorstelling()?.datum_tijd_2);

    if (!dateString) {
      return null;
    }

    const date = new Date(dateString)

    return this.formatDate(date);
  }


  constructor() {
    this.selectedDatum.set(this.beschikbareDatums[0]);
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
                  select: this.selectedVoorstelling().titel,
                }
              ),
            })
          );
        }
        this.selecting.set(false);
      });

    effect(() => {
      // console.log('reserveringenVoorVoorstelling', this.reserveringenVanVoorstelling())
    })

    effect(async () => {
      const nieuweGeselecteerdeVoorstelling = this.selectedVoorstelling();
      const nieuweGeselecteerdeDatum = this.selectedDatum();

      if (!nieuweGeselecteerdeDatum || !nieuweGeselecteerdeVoorstelling) {
        return;
      }

      let reserveringenVoorVoorstelling = await this.client.getAll<Reservering>('reserveringen', {
        expand: 'voorstelling',
        filter: this.client.client.filter(
          'voorstelling.id = {:voorstellingId} && is_vriend_van_tovedem = true', {
          voorstellingId: nieuweGeselecteerdeVoorstelling.id
        }
        )
      })

      if (this.selectedDatum() == "Datum 1") {
        reserveringenVoorVoorstelling = reserveringenVoorVoorstelling.filter(x => x.datum_tijd_1_aantal > 0)
      } else {
        reserveringenVoorVoorstelling = reserveringenVoorVoorstelling.filter(x => x.datum_tijd_2_aantal > 0)
      }

      this.reserveringenVanVoorstelling.set(reserveringenVoorVoorstelling)
    })
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

  onVoorstellingChanged(newValue: any) {
    this.selectTerm.set(newValue.value.titel);
    this.selectedVoorstelling.set(newValue.value);
  }

  onSelectDatumChanged(newValue: any) {
    this.selectedDatum.set(newValue)
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

  formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0'); // Day of the month
    const month = date.toLocaleString('default', { month: 'long' }); // Full month name
    const year = date.getFullYear(); // Full year
    const hours = String(date.getHours()).padStart(2, '0'); // Hours (24-hour format)
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Minutes

    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }

  async printHtml() {

    const htmlToPrint = this.createHtml()

    const w = window.open()!;
    w.document.write(htmlToPrint);
    w.print();
    w.close();
  }

  createHtml(): string {
    return `
  <html>

  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
    @media print {
      img {
          display: inline-block;
          width: auto;
          height: auto;
      }
    }
  </style>
  </head>

  <body style="display:flex; font:400 14px/20px Roboto,sans-serif; letter-spacing: .0178571429em">
    <div style="display:flex; flex-direction: column;">
    <div style="display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;>
          <div>
            <img
            style="width:12em; height:12em;"
            alt="Tovedem image"
            src="data:image/png;base64,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" />
          </div>
          <div style="align-items: center">
            <div style="text-align: center">
              <h2 style="font-weight: 200; font-size: 2em">
                Gereserveerd voor:
              </h2>
            </div>
            <div style="text-align: center;">
              <h3 style="text-wrap: wrap;>-Klaas Janssen-</h3>
            </div>
            <div style="text-align: center">
              <h3>${this.selectedVoorstelling().titel}</h3>
            </div>
            <div style="text-align: center">
              <h3>${this.formattedSelectedDate}</h3>
            </div>
          </div>
           <div>
            <img
            style="width:12em; height:12em;"
            alt="Tovedem image"
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAB2CAYAAABh7bmNAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACCBSURBVHhe7V2Hd1TV9v79Ae/5TJmZOwlN0AABhFBDSZuUSSMUQZAiNhRBEBQUUYSnDxCkCCKiogiiFBMmM0kghUBCII0QAqF3CBJIEIJCwFD27+wzZ0g7M5lyJ1My31rfIovcuWXOl3332Wefvf8PXLAbVBUfgpMLFsCBl0bBPkUgFI4YDsfnzoWb+fnsCBeagkvQZuLu3btQVHQQMjIy6b/37t1nvzEdD8m5SiZPgZ2CO6EAyUJ7wucIO8AOwYv+/4GxY6H6yhX2CRf0wSVoE3HkSCksXbYCYmKHwqCAkCeMG/ICfPfdD+wo4/Hgr78gJ2AQEa0nJMl8IVGuAJU8GlTecaDyioVEIRQ0sufJ7yWQ3qEtlGuS2Cdd4MElaCNQU/MA0tIzYMo779YTMY8TJ06ixxuL3JhoKlaN4A/x0qGQIImB7RIlYQRlgiSa/r/aO5hYa29IFdzgxPz/sk+70BAuQRtAGXnFr/n2Oxj+wiiuePVx9kefsDMYxtVENXUnkuQ9IV4ylIk4nMsEyWBQCVGQLPOhos4bEgfVly+zM7mgg0vQHOTm5cP8/34OAYEKrmCN4dGjx9jZ9CMnYCCkCG1guxBNBBvJFXItw6i1TpDGQZLQm7oo6e1bQ3lyCjubCwiXoBn+Ir5sfIIKJrzyOlegpnLVqtXszHxUHTpEROlGXI0eRKhxVLB8IdclHqOEeM84UHuFPHFBjn86j53VhRYv6JMnT8HiJUtBGRnLFaa5fO+9WewKfBRPnEgEKaeTPrS8fAHrZzy6ILLIJy7I/qhIuHvxEjt7y0WLFPTDhw/pJO/9mR9yxSgG0e/Wh5qbN2Gn3IOIsTNxIQZzBds0a10QtayXNgrSzrvFR0FalKDLy8th/c8bYcTIl7giFJvXrl1nV66PsytWUB9YLQ8goozliNVY6lyQIZDopSAWv5XWBZn7KbtSy0OLEDQufMz9dD4EBoVyhWctFhQUsjuoj8xunclksD2ZDGKITn9kwxTWRkE6UlHnRkfBnXPn2RVbDgwKuqamhvqYJYePwNWrV02Kr9oalZU34PffE+CtSVO4YmsObt0Wz+6mFtd2ptJQnVrWh4rQuMmgMax1QTRCH+qCpLX1oqHBlgSuoO/cuQOrvv4Ghgwd8WRwAoMUdDXs5Qmvw4ez58AXi5fCTz/9DKmp6ZCXVwDnzp2jn3v8+DE7S/OjoqISUlJ2wkdz5oIiVFlPXLYgfkcNkTc4lkYnVAIumjQVqjOVtS6IWo4LMVoX5NhHc9jVnR+NBH3lyh8wbPiL3AFqipFRg2Hki2Ng6rQZ8NlnC+Dr1WsgYbsKsrKyofToMWo17983P+ehIfB8+/blwvc//AjTyDVDFBHc+7IV3548ld2pFneJC0AXUmTdiJgxVMcTpTjUuiDRxAXpRK7pBnnEBbl7/gK7E+dFPUGji2GumI0hCm5w3DB47fU3qRVFC7bxl18hLS0dcvbtp6I/fuIknCdffFlZGf35+PETUFB4AHZl7qZx4q9Wfg0ffzIPxo6dYHcCbsjYwcNoREWH0lmzYKdcComyYCI49J/5YhSHWhdku4y4IN59qQuCUZCrxMA4M+oJeuPGTdyBcdE8BhBeIG88xKN796hPmyx7jvi5GNkQZzJomMwFIW8DjIKkMBfk6Iez6T05I54IGn3fMWNf5g6Mi+ZxIOGe3Dz6/V5f9yONPWuEAZDgaW7s2XzWdUFQ1PtCQ6Cq5DC9N2fCE0HfIxYkLDySOzAumscBgQrYxqIMh3r1IBayLc3b0GbT8YVnPbIoCLog8n5kwigjwnaHU4u+gMePHtF7dAY8EXR1dTUoI2O4A+OieexHBL3593iorqiAXMm/IEnoRayzdSeDhokuSITWBZGHUfcHRZ3dv4/ThPfquRyjRo/lDoyL5rF7SDgsm/85HJs+HTJkAqiIiBIkUQ1EZgvifZBJqWwwsdb+T8J7BUOHQMWuTKYIx0S9SSGGvngD46J57BISAcMCgiFL9h9IlfkSEdnSOjdkrbXGFUaNrAcRthxS5W6QHzeYWmxHdEXqCfp/CxZxB8ZF04kRjufComB29+ehyOMpUHsFaa0iV1y2JFrrSK2w5RFE2N21FlvuDlm9/eDUF4vh79OnmULsH/UE/cMPP3IHx0XT2TswFPqHhML2NjLYK21PXu/i5W1Yi+gOYa61SlCCWtqL5ptg/Br97Py4WDi3+hu4XVrK1GKfqCdojSaZOzgumkZqnUMjYVKv3lDk+S8ikH42CdWZS2qxcfIqiwa1PJCubGKEZqcgpSudWX17wuHJk+H82rVws6AA7pdfYwqyPeoJGlfkeAPkomnsT9gtTAnrnm0Hee4yiJcRy+wpdt5GcxDzTWJowpNKiIRE4jahr43RkR1CayZwD7pglO3fCwqGDYHSGdPh1KJFcGXLFrixNwf+PnUKHlZXM4VZH/UEffHiRe4AuWg80Tr7ksngiP4DYZ/sKW3ehk1DdWJRqRW3ZDAReAwReDjN51ZLe9NnxJ0zybIOxJK3JmLHWiIyKnZkZteOsHeQPxSNGQ2lM2fSfPCrajX8uT8XqsvK4LGIWZz1BI3FU8LCo7gD5aLx9AmLhMWdO0GR+9MQL4QQ62z6Fiv7pjZTkAocXSkZE7mMWHFvJagkwWQSTMQu6wsaqR+tN4KCTxGeoRNOjKborHtqKxns7u4L+8NCoPj11+Do7A+pK3Ntxw64STyGfyorTRJ8PUEjMOmHN0guGsceQWEQFhgMqd4ekC59DuIt2pHiaNQJPeqJ2OmOHFks+TeauCyE8nBQSYnr4h1IrTtGVZJknakbkyK0Y4IXiNglhJ6Q3qEN7O7RBQqGxtGyaFguzRAaCfrd6e9zB8rFponuxrNhUTCrRw846PFv2E7zNlqSoA0RIzzotjDBk++FCl6KJD9Lidi9o4jYQ4nYQ0DjNYAJvptW8LQsGgrdg5ZNe6QnDbmRoBcsXMwdLBebZt9ABfRRhMHmdt6w17MVxEujiLthi7wNR2RdwUdrBU+sOxU7sfaYWJUoD6XuC4o6RxECj2pqmGpr0UjQ635czx0sFw0TrbOPIhJe7dsPCiT/Iv5jTzIozjAZtBdqIy5YFk3jhfndnlA0fjxTbS0aCRq3MPEGzEXDxFRR3zAlrPbpAAUenhAvCyPW2bK8jZROIyDv5XlQOv97OPu9Cs58mwBH5n4LeePnQYrvi9zPOD+VRNTDIEnoRkTtDpVZ2Uy5WjQS9IEDRdwBc9EwuwaHw+CBAbBHeBp2kNciFoLhD0jTzBk+C8q274GH1fq3qz28/w9cyyyEwrcWcs/hzESXBPdk4t7MovHj2DeiRSNBX7p0mTtgLuqnNm8jEuZ36QIH3Z+CBCGQWGfT8zZSOo+EK5q9bCSMx9/nrsDB6cu453RW4mQSJ4uZXXzYt6BFI0FjXnSE0vHzol9++TU4duw43bPI+72Y7BUYCgFBClC3lkKm5BnySiRi9uQPhD5mx86A+5W32CiYh8p9JZDqN5Z7fmcjLvDggk56+1bs6bVoJGjEuPGvcAfOkYiJVjqcPn2abqzlHWcpddZ5as9ecNDD/LyNG/niJP3U3L4DeyLe4V7DmVgraG/25FpwBT19xkzu4DkSsRxuQ5w6dRqWL19JSy3wPmMO/QMU0CM0HDa0bw37PeRkMqg0K1S3O2wynPtJA2UJu6E8LR9uHjwJ1Vcq2J2bhscPHkJqz3Hc6zgLcWUyWfCBrD5+7Km14Ar6iy++5A5ec/DLL5fDxDff5v7OFOJbRh9wdw7Wb96yZRt89vlCWl3phRGjIDwimnsufUTr3EmhhJf8+0Ou7N/EYnSnecW8ATCHKnkkpPd7BXLHfgInl/2qteJGFvK5c/4P7jmdgbgwg607cAn96AcfsCfWgivoDRt+4Q6gtYlFaRBYOZ/3e1N5/Tq/WCIPWD+jqqqKljzDmiB1ib741q2/w5tvTW50jU7E3VjWyQeK3N2JdVZYHKprimh5MXRXdewcu3P9ODRzJfccjk7c+aMResJOuTvcKjrInlYLrqB37ExtNHDWpkpVu0kTqyuJsWEXRSg2EtWaJ+fHvA1lQBCkebtDmrRjs+dt5E+YT10Tfbh7+Rr3c47NCJqnjZsPMC+7IbiCPniwuJ4wrEmspJSfX8CurAW6BOgC8I43hVg21xrAqqJ0MhgaCdP8ekKR51PkS7Zd3gZaYn0x612Bb3I/46jE5XDcdIDJS2eWNq4dyBU0vmZ5AhGbuIex6vZtdtVaiCVopM6NERtfrVwNXUKV8DWuDLrLyCSFfOE2TOJHV+TPA437uhx8dyn3eEclRpCShOeJu+EG1ZcadyzgChqbSIrdoqEuZ82aDYcOlbCrNQZePzomjvtZU4lVU9EvFhv//PMPREdG0dhzhsQH4ml5L/4gNCf/SNnH7lCLI598yz3OMamkO2ew0VJulJI9YX1wBY3AhQmeQMwlNqrECAYWZGwKYr8hRowcDbduWbZowcOGJV/Cftl/QC3rbVbs2Vq8unM/u0OgeSC8YxyR1N0QBtCSapd/+YU9YX3oFfTMWZb3H8FaediQZ8+eLFo72likZ+zins8SYs8TrGRqKrA71oULF6Gk5DB9q+DPaJ0R22bPhgMebpAgw6Vu+9qVUnVUGwXJinqX+3tHJF1METpBamsZPLj9F32+htAr6CVfLuMKoyl+Mnc+FeTly2XsTKZj1gcfcc8tBr9d+z3cuHGDXYkP7Fqwbt1P8M7U6dxoS9ywkTBi4luw9tlnINfdi/jPuJBiX3nP6taxkDHoDe7vTCEu+Bz+eA1c2pxGF3yQV9TZcGzhetg/eg6o2zbPm0kbew4H3K9Y/OqrbKQaQ6+gTc2BwDZmFzlOuqlAsfHOLyZx3ySuJKrVSTTCgtYXC6dv2vQbTJkyjfuZuuwdFAohgcGQ2Ib4z54dyZdtjwVkLGPhxP9xJ5kNcb/iJpz/Ocnqy+2YW67GhqNyd6jYvZtdvTH0ChqLkPMGk0dsyCMWsN0F7xr2xK4hETDKvz9kyZ8GDU3ktx//2VKm+o2D61n1FyuMxeXfM6205I6x5xi6qxx3kBuCXkEXFx/iDmZDihnrTUpyjEI3HUMj4V0/Pyj0fBpUsoHEf3YOC7136EyDOdjG4OG9+1A0ZQn3/OYS34CJ8iDAneInPmuco1MXegWNvVZ4g9mQaMnFAE4ceee3R+Jy90LfTlDoISETQlzudsQiMo15csVvbDQsx4klG7nXMIfobuBmWYw9N9WqTq+gaZy1iVgwFkjXzfgtQXPkLIvF/gEK6KkIhx+ebQP7PFpDvBTFjBs8+YPhSMSJZNE7S+D44g1wYukmuLAhBSr2FsNfp8ybGx2atYp7HVOYoIs9y1pDrjKCnVk/9Aoa8eprE7mDqmPDLk+mAPM1sBEQL+HHntknMJQu1sS3ESBD6gPxTjgh5DGt98uQN/5TOLMmHm6fvMhGsWmk9Z3APZ+xxPmJWt6fxp7LftvMzqofBgWNK3q8QdURQ3R1gR1bMdyFyfSvvPoGjUMjMT0T27x98823lB98OIf2POSd0975fHA4xA0YBBle7rBD8rxTTQhNIe6wOb9eAw/uGK5bV55RwP280ZQNplWX0trIiX9+j51VPwwKeumyFdxB1RFX/7Kzc2j466Ux47nHOBt9FRHwcp9+sFdGJoRCX9ju0bILyezoMgpOr95mME/b3G1htNqSEEomgwIcnjaNnc0wDAr6l02/cQe1JbOjQgnTevlBgac7JEoG0i+dNxgtjRkDX4fr2fxwX/GM5dzPNEVcGdQIfrRcQdUhwyXAdDAoaGx7zBvUlkwsxPipry8UenhAggwLMdpDzxT74YkvG+dYnFmbwD3WMHEyGAVYl3rvAH92pqZhUNAnTpzkDmpL5QDCrmFKWOrrA7meAvwuhIPKSUJ2YvLgtPp5yhd/TeUeZ4h0MigMJJNBT7i4rnbDc1MwKOgHDx5AVLQ4aZzOQAzZ9VCEw5qO7SDPrRWLPztHyE5sYvhPh0tb07nHGCSZDCZhk1BvCTz4+292pqZhUNAIMbLunIX+gQroGxQKG9t6Qxatv4H+s0vQ+oixbMz1yH3pY+7v9VE3GcRqo4cmTWJKNA5NCvq337ZwB7clksaggxWwrY0c0mSY1N8yYtCWMNHb9EkztsDQTgbd4NbBYqZE49CkoM+ePccd3JbInoFhEBYUDIltpZDhgX0HxQ3ZYQgsZ/gHNEGI9/uWQd1ksA3kBAxkKjQeTQoaMWz4i9wBbmn0CwqHqIBASGntCRnu2DtFvEWV0nnfw8O72oWDRzUP6Ouad5yzUzsZ7E+sswdc+nkD/T5MgVGCbmqBpaWwO1slTPdyhzSP7qIJev+oOeybro/y9PxmS6C3G8piIUnwoZ21jFkZbAijBF3oKrFL2U0RASP69ofdMjcyA/cTTdCGKo7eufAH7FFO5X7O2ZjgGUMmg8E0TbT0/ZnsGzANRgkaqwpZcxe4oxAF/QIR9C7BHRK9esN2kepw3Dpyhn3T+nFswU/czzoTaUUkWVfaSP/OuaYrQ/FglKARtqx3Zy+sK2i1vJcogsYoQM0t4+KsNwqOwm7F29zzODpxz6CuiHnekDj2xKbDaEGXHD7CHeSWRGsIOr2//g2f+oDJQM7lW4fRIpcaoRftK16Rmcme1HQYLWgElgLgDXRLoTUEjWE6c1B9tVKUBHr7oBK2C1ivrh3s6dmDPaF5MEnQLb1DFp0U9tFOCsUSNPZIsQS4mwRr22GPP975HYHarLoBNFR38Yd17MnMg0mCrqio4A60vTM0LJJu5n1x1BiTa0DXJSb3D+0/EHbJ3WCnpIcoUY7Dc75h365lwEqjOHHEnSW869g1ZbG0k2x6O2+zQnV1YZKgETMcpLo/Fk3HOhtHjpTSMmAYqXn06DEtDpmVlQ3vvf8B93OG2CMoHKIDAmBHaw9IdxdntwqKUEw8Js+IxWAOvL0Ikn1e4F7TnkjLe3nhjm4JHP90HnsK82GyoHGbFW+wm4tBwWEQQl79AYEK7u+nTptBywEbAyzthdWReOfh0S8wDCICg0DTRgIZ7uIsfYu507ohsN/K1Z25UPLBKsgMmQQqmf0lUmHeRpLQmRaQuX/N+AL1+mCyoBGjRo/lDrg1GBwSDvPmfQbJyTugtPQolJdfg8rKG7TMAtYO2bkzjYYUsbUEbro1B5u3bOVeuyF7B4ZCcLAC4tsKkI4FzkVITjq3LpHdhfVx91I5/JGcA8eXbITCNxfQakfYwBN3e/PuzdrUZtVhawmZyVl1+mCWoJOSU7gDLjZRqOXl5eyq1gW+eQKDQrn3oWM/8lboR47Z1NYLMmUdREkfxQ6xtgQ28Lx37U+4ffw83MgrhYqcEtrLpWLvIboJ1tJd24aICynYEZYupJxpenHJGJgl6EePHkFMzBDuoItFbP3Q3EB/m3cvOmKCvx95Y6z1aQu5bm3IoFie4I/NgOwZWAkJGxfx7t0Saq1zGPGd5VA46kV2NcthlqARv/66mTvoYnDrtnh2leaHRqO/HNmTLVidn4M82sINt2BZVnX06GeWhamaA1hvmnfvlhCrIWElfrTOVSX6i9+bCrMFjRWTsHISb+AtIVb/tDUMFb/BTbJzfX2hwNMT4gXLN8kWv7eCXdV+gb43797Npc46446UfAuWuXkwW9AIYydTphA3FNgahw0s82MZg3d69YQCiTskSgcRS2NZGYPccXPZVe0XmA3Iu3dzSWvVYZ8Uka0zwiJBI8T0pV9/4y12VttDXySniyICxvb1h2zhaVALfSwuNJMZZD/PrA+Yb8K7d3OorSSKhcuJdY4T1zojLBa0mLU7bOk7N8SqVau59+gXFAaRgwJhh7cnpEq6QrzEssUVdasYePDXXXZV+wO2a+bdt7mMp3FnX2Kd3eGvE/p7LJoLiwWNGDtOnGb3589fYGe0PfT9oWJv734hobDpGW/Y49me+oOWRjowLdQe8eDvarM2ufKJGXVYeDGA5myUTJ7MriIuRBE09s3mDb4pxAac9gR9u3QGEnYJU8LyTs9CvrtALA6K2bJIB60NZ4fATrW8+zWHmO+MVfhx82taazk8vGudt5IogkbMm/85VwDGEpes7QmGtp35hEbCzB7doVDiBgmC5R2wcoaZt93ImsB8EN69mst4yRBIlmsbZv4Rbz3XUjRB3yV/cYpQJVcAxvDz/1mWRik2sJEQ7z6RXUIiYLR/fzox1IjQoxBzLP65yW9TZgugq6FuI9ZyeBiNaqjlg2iN5wNjxrCrWAeiCRphSqOhhlywcDE7i31AlVjbpL4hseBMQFAIbG8jhV2eWPTc8sG39RJ4XeQMn8W9R9NJxCyJYVur5JDx3DPwsNpwPWlLIaqgEeaml4oh6Js3b9GcDJzQ/fTTz7Diq1XU8mPiEnLBgi9o9AKrQWXu3kOLUd7j5N/ieYYOG8G9TyT1o8nbaGXHDqL50am9xrOr2xbHFq3n3p/pRDFHslzn9jSq8WdePruK9SC6oLHzKqZ38oRgiLM/+oSdwXjgtbKy98LSpctp+wxzVi4xjv7+zA9pn5ecnH3w2+atRnUXQD96KnbCkjxNBk2cTlhlqiz2ZLZB2fY93Psyj0pIkKLfrE0+Orfqa3YV60J0QSP27s3hisAQR48exz7dNDDfGS26LSujdg8Kh5hBgdrWFFJxqihhKTBboTL3CPeezCWKOUneh1rm4olvsqtYH1YRNGLZ8q+4QjBEfNUbAra/wH4tvM82NwcEKKB7aASs69AWcj28idtBXq8WJiohxdqSZQqwY6yYyf/xOAn0IpNAwQP2h4ayqzQPrCZoRFNdtBoSX/s8oK87bdoM7mdsxQDC54jbMZ24HUUe/6ELBmIVbyxPzWNPbn1g3vN2Ogfg34tp1JYjULPqR5nduuhtMm8tWFXQVVVVJvm1mGCPPbd1ePz4MZ3c8Y61B+IyeHhAECS38oRdQle6nYg/0KazqvQs+xash0tbzChErpfalcBEmYKIWYC0tt5w1wYrv1YVNOLYseNcMRjiu9Pfp23gcJc27/f2wn5BCpj98aewf+o7kOMpo+EpOrPnDrhp1LSLM6p5vLkonfcd97rmESMaRMxybXgO20hUHRI3i85YWF3QiF27MrmCcHTilqyamhqovn4d9kmeAjVdZEErHdZgwM3npW0Z7FsUBzcPnoQ94VO41zKPuHBCxOyl1IqZ+M039u1nV2t+NIugEZhJxxOFI3PJ6jXs6QBy/XvTyj/bZZjwb/nksC6Lpn4J9ysNT5ibAtbtwII0vPObTyZmnWUmYr6eLu4foKloNkEjvvt+HVcYjkhceKmLss1b6IBqhP709SumlUZq2g+BU19tNnmJHDe9YgMflVwcV6gucQKIPvMTMaels6vaDs0qaMTatd9zBeJoPH36NHuiWmT6+hAr/Qyx0pisJK6V1hGFjeXDcEf2n4XH6PYo3LWNRCuMfje2UcO6d+n+4iXmNyQVM41mCFTMf+6vnczbEs0uaAT2A+eJxFGIHXZ5uLRhIxlcd9DI/emAi22luZRG0LoaSOsXksHniSDPNgQ03pjXLIH0Dm2hqti4Lq/NAZsIGrF16+9csdg7sc2dIezu0ZXm/KIvLVbEwz6ozc2IlxIxy/tSq7ynl59NQnOGYDNBIzBBiCcaeyUuz2NNEkO4tmMHGWw3SJL3pIPPF4ejEcVM3ChshkkLw7hDXkw01Ny8yZ7afmBTQSOOHz9hMLPNXhgZNZiWIDMG+6OURNQyMvtHIWDSUjO4HlYkRjJU8mhIlj1LE40OvWW/G3ttLmgEVgSdNWs2V0j2QNy4cM6Enh/YHwR96WTBh1g19KWt7dtagzp/mUz+5CGwQ2hF3zxnli5jT2mfsAtB6/Dzhl+4grIlcemeF9FoCqcWLqSi1gj9aOaZY1lpnYsRBxqvfuQ5pJDerhWUJyWzp7Nf2JWgEaVHj5mc1GQtDhs+Ei5cuMjuzHRk++PkyfFcD1qaQYiizePRKucqI8hb5zx7KvuG3Qlah/XrN0BgEL8GdHNw0tvv0OQqS4AVNdFK09i0EEujBPYravyji6IhOcwcRBcjVe4Gx+bwm4LaK+xW0IiysjKLd5Obw+XLV7I7sByX1v9MhZEkdCWvcHQ97NGfJr4y5qBQq9yVbmbN7NYZrqemsadwHNi1oHXAwua4TYonPjGJLgZuIhAbWMwbQ11JXn2pBeSLyjZEVwjTXnFXts4qYxGYGgvfTraCQwhaB6yV8dGcuVwxWsqvVn7N3TArFnJCgqnlw9c5tYYccTUnqXtBJquJXmGQLOtIXCMP2OP3PJRrktgdOyYcStA6nDlzFlasWAmxg4dxxWksQxThsHDRYrh46RI7s/VQc+sW7OrsQyMGiXIFE3Xz+9NaPzkOVIISNDKsACqjfj427LG0A5U9wCEFrUN1dTVkZGTCnI/nQlh4FFe0PE545XXYuHETVFRUsjM1D+6cPQuprQTyaheIqFFczWepMQxXK2Q/cg/edJGkaOwYuH3kCLtDx4dDC7ousHUbihst7tixE6j1josbDiNfHAOTJk2BRV8sAZVKbdICiTWAiTw7BU8iKC/yuieWWjqUio0nQsupJOeOJT4y5iyHESF3p0JGi5w/OBYqdpnfgthe4TSCbgi03vfu3ae9Ce0NlVnZkOqFr3opEVk3UMkj6MRMG6u2JO1UuwUMRYxla1VCFKi9AiBJ1pkIWU4nfFgx3xGjF8bCaQVt78AYddH4cUTUbtRaY7gMG1CiCNGiUsuKEQgau0aRIzHkp/sZrS+KF4/BY2NprBv/ODC1M4n8oeAOGnwbpLcWoGTKFLiRvZdd3XnhErSNUZmVBcWvvELdALTYKEIqbmkfUHuH0B0hmOeMvbxVXjGU9GfyfyppKKhbhZBj+9EJXrIMNxhgzoWEWGPMiIuE82vWQPWVK+xqzg+XoO0EOGE8t/obKBw5HDI6ai0rNqTE2HCK0JYKPVl4lrAD/Rn/D3+HE0w8NrW1FLIH9IGSSW/B5Y0baYJUS4RL0HaImtu34c/cXLi86Vc4tXABHJ78NhS/9ioUjhgOBcOHEos+AUomT4IT8+bBxXU/0hzs6rIy9umWDZegXXAquATtglPBJWgXnAgA/w84LzJN0Te+ywAAAABJRU5ErkJggg==" />
          </div>
        </div>
  </body>

  </html>
  `
  }
}
