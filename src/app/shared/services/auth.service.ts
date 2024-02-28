import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { RecordAuthResponse, RecordModel } from 'pocketbase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public userData: WritableSignal<
    RecordAuthResponse<RecordModel> | null | undefined
  > = signal<RecordAuthResponse<RecordModel> | null | undefined>(undefined);

  public isLoggedIn: Signal<boolean>;

  constructor() {
    // check the localstorage for userData
    const existingUserData = localStorage.getItem('user_data');
    if (!!existingUserData) {
      this.userData.set(JSON.parse(existingUserData)); // triggers isLoggedIn-computed
    }

    // check when new userData was set
    this.isLoggedIn = computed(() => {
      const userData = this.userData();
      let isLoggedIn = false;

      if (!!userData) {
        isLoggedIn = true;
      }

      return isLoggedIn;
    });

    // save new userData to localstorage
    effect(() => {
      const newValue = this.userData();

      if (newValue != undefined) {
        console.log(newValue);
        localStorage.setItem('user_data', JSON.stringify(newValue));
      }
    });
  }

  registerUser(userData: RecordAuthResponse<RecordModel>): void {
    this.userData.set(userData);
  }

  unregisterUser() {
    localStorage.removeItem('user_data');
    this.userData.set(null);
  }
}
