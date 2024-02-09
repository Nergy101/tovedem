import { Routes } from '@angular/router';
import { GroepPaginaComponent } from './groep-pagina/groep-pagina.component';
import { AgendaComponent } from './agenda/agenda.component';
import { ReserverenComponent } from './reserveren/reserveren.component';
import { PrivacyBeleidPaginaComponent } from './privacy-beleid-pagina/privacy-beleid-pagina.component';
import { HomePaginaComponent } from './home-pagina/home-pagina.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePaginaComponent,
  },
  {
    path: 'Agenda',
    component: AgendaComponent,
  },
  {
    path: 'Tovedem',
    component: GroepPaginaComponent,
  },
  {
    path: 'Cloos',
    component: GroepPaginaComponent,
  },
  {
    path: 'Mejotos',
    component: GroepPaginaComponent,
  },
  {
    path: 'Reserveren',
    component: ReserverenComponent,
  },
  {
    path: 'PrivacyBeleid',
    component: PrivacyBeleidPaginaComponent,
  },
];
