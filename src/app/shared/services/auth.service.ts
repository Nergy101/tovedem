import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RecordAuthResponse, RecordModel } from 'pocketbase';
import { SideDrawerService } from './side-drawer.service';
import Gebruiker from '../../models/domain/gebruiker.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sideDrawerService = inject(SideDrawerService);

  public userRecord: WritableSignal<Gebruiker | null | undefined> = signal<
    Gebruiker | null | undefined
  >(undefined);

  public userData: Signal<Gebruiker | null> = computed(
    () => this.userRecord()?.record ?? null
  );

  public isLoggedIn: Signal<boolean>;

  constructor() {
    // check the localstorage for userData
    const existingUserData = localStorage.getItem('user_data');
    if (!!existingUserData) {
      this.userRecord.set(JSON.parse(existingUserData)); // triggers isLoggedIn-computed
    }

    // check when new userRecord was set
    this.isLoggedIn = computed(() => {
      const userRecord = this.userRecord();
      let isLoggedIn = false;

      if (!!userRecord) {
        isLoggedIn = true;
      }

      return isLoggedIn;
    });

    // save new userRecord to localstorage
    effect(() => {
      const newValue = this.userRecord();
      if (newValue != undefined) {
        localStorage.setItem('user_data', JSON.stringify(newValue));
      }
    });
  }

  registerUser(userRecord: Gebruiker): void {
    this.userRecord.set(userRecord);
    this.sideDrawerService.open();
  }

  unregisterUser() {
    this.sideDrawerService.close();
    localStorage.removeItem('user_data');
    this.userRecord.set(null);
  }
}
