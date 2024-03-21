import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AdminModel, RecordAuthResponse, RecordModel } from 'pocketbase';
import { SideDrawerService } from './side-drawer.service';
import Gebruiker from '../../models/domain/gebruiker.model';
import { PocketbaseService } from './pocketbase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sideDrawerService = inject(SideDrawerService);
  client = inject(PocketbaseService).client;

  public userRecord: WritableSignal<Gebruiker | AdminModel | null | undefined> =
    signal<Gebruiker | null | undefined>(undefined);

  public userData: Signal<Gebruiker | AdminModel | null> = computed(() => {
    return this.userRecord() ?? null;
  });

  get isGlobalAdmin(): boolean {
    return this.client?.authStore?.isAdmin ?? false;
  }

  public isLoggedIn: Signal<boolean> = computed(() => {
    const userRecord = this.userRecord();
    return !!userRecord;
  });

  constructor() {
    // check the localstorage for userData
    const existingUserData = this.client.authStore.model as Gebruiker;
    console.log('test1', existingUserData);

    if (!!existingUserData) {
      this.userRecord.set(existingUserData); // triggers isLoggedIn-computed
    }
  }

  registerUser(userRecord: Gebruiker | AdminModel): void {
    this.userRecord.set(userRecord);
    this.sideDrawerService.open();
  }

  unregisterUser() {
    this.sideDrawerService.close();
    this.userRecord.set(null);
    this.client.authStore.clear();
  }
}
