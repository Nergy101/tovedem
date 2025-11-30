/**
 * Form model for contact form
 * Used with Angular Signal Forms (experimental in Angular 21)
 */
export interface ContactFormModel {
  name: string;
  email: string;
  subject: string;
  message: string;
}

