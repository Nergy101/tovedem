import { Routes } from '@angular/router';
import { GroepPaginaComponent } from './groep-pagina/groep-pagina.component';
import { AgendaComponent } from './agenda/agenda.component';
import { ReserverenComponent } from './reserveren/reserveer-formulier/reserveren.component';
import { ReserveringGeslaagdComponent } from './reserveren/reservering-geslaagd/reservering-geslaagd.component';
import { PrivacyBeleidPaginaComponent } from './privacy-beleid-pagina/privacy-beleid-pagina.component';
import { HomePaginaComponent } from './home-pagina/home-pagina.component';
import { VriendWordenComponent } from './vriend-worden/vriend-worden.component';
import { LidWordenComponent } from './lid-worden/lid-worden.component';
import { ContactComponent } from './contact/contact.component';
import { SinterklaasComponent } from './sinterklaas/sinterklaas.component';

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
    path: 'Reservering-geslaagd',
    component: ReserveringGeslaagdComponent,
  },
  {
    path: 'Vriend-Worden',
    component: VriendWordenComponent,
  },
  {
    path: 'Steunen',
    component: VriendWordenComponent,
  },
  {
    path: 'Lid-Worden',
    component: LidWordenComponent,
  },
  {
    path: 'Sinterklaas',
    component: SinterklaasComponent,
  },
  {
    path: 'Contact',
    component: ContactComponent,
  },
  {
    path: 'PrivacyBeleid',
    component: PrivacyBeleidPaginaComponent,
  },
];
