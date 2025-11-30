/**
 * Form model for signup form
 * Used with Angular Signal Forms (experimental in Angular 21)
 */
export interface SignupFormModel {
  username: string;
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
}

