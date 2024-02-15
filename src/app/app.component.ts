import { Component, LOCALE_ID } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AgendaComponent } from './agenda/agenda.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { registerLocaleData } from '@angular/common';

import localeNL from '@angular/common/locales/nl';
registerLocaleData(localeNL);

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    RouterOutlet,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    AgendaComponent,
    NavbarComponent,
    FooterComponent,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'nl-NL' }],
})
export class AppComponent {
  title = 'TovedemReserveringen';
}
