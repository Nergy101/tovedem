/**
 * Form model for the password reset (confirm) form
 * Used with Angular Signal Forms (experimental in Angular 21)
 */
export interface WachtwoordResetFormModel {
  password: string;
  passwordConfirm: string;
}
