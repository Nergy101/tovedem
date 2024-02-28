import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { RecordAuthResponse, RecordModel } from 'pocketbase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public userData: WritableSignal<RecordAuthResponse<RecordModel> | undefined> =
    signal<RecordAuthResponse<RecordModel> | undefined>(undefined);

  constructor() {
    effect(() => {
      console.log(this.userData());
    });
  }

  registerUser(userData: RecordAuthResponse<RecordModel>): void {
    this.userData.set(userData);
  }
}
