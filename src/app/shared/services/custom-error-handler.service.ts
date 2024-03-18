import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class CustomErrorHandlerService implements ErrorHandler {
  private toastrService?: ToastrService;

  constructor(private injector: Injector) {}

  handleError(error: any): void {
    if (!this.toastrService) {
      this.toastrService = this.injector.get(ToastrService);
    }
    console.error(error);
    this.toastrService.error('Er ging onverwachts iets fout.', 'Oeps!');
  }
}
