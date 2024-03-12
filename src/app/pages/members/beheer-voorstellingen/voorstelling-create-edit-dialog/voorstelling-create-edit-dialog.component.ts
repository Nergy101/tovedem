import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { QuillModule } from 'ngx-quill';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { DatePipe, Time } from '@angular/common';
import { timestamp } from 'rxjs';

@Component({
  selector: 'app-voorstelling-create-edit-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    QuillModule,
    NgxMaterialTimepickerModule,
  ],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './voorstelling-create-edit-dialog.component.html',
  styleUrl: './voorstelling-create-edit-dialog.component.scss',
})
export class VoorstellingCreateEditDialogComponent implements OnInit {
  titel?: string;
  ondertitel?: string;
  regie?: string;
  omschrijving?: string;

  datum1?: Date;
  datum2?: Date;
  tijd1?: string;
  tijd2?: string;

  selectedSpelers: any[] = [];
  selectedGroep?: any;

  modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
      [{ direction: 'rtl' }], // text direction
      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],
      ['clean'],
      //['link', 'image','video']
    ],
  };

  groepen: WritableSignal<any[]> = signal([]);
  spelers: WritableSignal<any[]> = signal([]);

  client = inject(PocketbaseService).client;
  datePipe = inject(DatePipe);

  async ngOnInit(): Promise<void> {
    this.spelers.set(await this.client.collection('spelers').getFullList());
    this.groepen.set(await this.client.collection('groepen').getFullList());
  }

  toTime(timeString?: string): Time {
    const timeTokens = timeString?.split(':');

    if (timeTokens && timeTokens.length >= 2) {
      const timeAndAmOrPm = timeTokens[1].split(' ');

      const minutes = timeAndAmOrPm[0];
      const isPM = timeAndAmOrPm[1] == 'PM';
      const hours = Number.parseInt(timeTokens[0]) + (isPM ? 12 : 0);
      return {
        hours: hours as any as number,
        minutes: minutes as any as number,
      } as Time;
    }

    return {} as Time;
  }

  async submit(): Promise<void> {
    let datum1 = this.datePipe.transform(this.datum1, 'YYY-MM-dd');
    let datum2 = this.datePipe.transform(this.datum2, 'YYY-MM-dd');

    const tijd1 = this.toTime(this.tijd1);
    const tijd2 = this.toTime(this.tijd2);

    datum1 += 'T' + tijd1.hours + ':' + tijd1.minutes;
    datum2 += 'T' + tijd2.hours + ':' + tijd2.minutes;

    console.log('datum1', datum1);
    console.log('datum2', datum2);

    const voorstelling = {
      titel: this.titel,
      ondertitel: this.ondertitel,
      regie: this.regie,
      omschrijving: this.omschrijving,
      spelers: this.selectedSpelers?.map((s) => s.id),
      groep: this.selectedGroep?.id,
      datum_tijd_1: datum1,
      datum_tijd_2: datum2,
    };

    console.log(voorstelling);

    const created = await this.client
      .collection('voorstellingen')
      .create(voorstelling);

    console.log(created);
  }
}
