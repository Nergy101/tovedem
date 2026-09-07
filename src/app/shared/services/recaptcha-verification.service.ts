import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Environment } from '../../../environment';

/**
 * Valideert een reCAPTCHA-token tegen de `/recaptcha` PocketBase hook.
 *
 * De hook gooit een ApiError (400/403) wanneer de check niet slaagt. In dat
 * geval bevat de response geen `result`, waardoor `resultObj.result.success`
 * een TypeError opleverde binnen een async callback: een unhandled rejection
 * waar de bezoeker niets van zag. Deze service vangt dat af en toont altijd
 * een toast, zodat een formulier nooit stilletjes niets doet.
 */
@Injectable({ providedIn: 'root' })
export class RecaptchaVerificationService {
  private readonly environment = inject(Environment);
  private readonly toastr = inject(ToastrService);

  async verifyToken(token: string): Promise<boolean> {
    let payload: { result?: { success?: boolean }; message?: string };

    try {
      const response = await fetch(
        `${this.environment.pocketbase.baseUrl}/recaptcha`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        },
      );

      payload = await response.json();
    } catch (error) {
      console.error('Error verifying captcha', error);
      this.toastr.error(
        'De beveiligingscontrole kon niet worden uitgevoerd. Controleer uw internetverbinding en probeer het opnieuw.',
        'Verificatie mislukt',
      );
      return false;
    }

    if (payload?.result?.success) {
      return true;
    }

    console.error('Captcha verification failed', payload);
    this.toastr.error(
      this.foutmelding(payload?.message),
      'Verificatie mislukt',
    );
    return false;
  }

  /** Toont de bezoeker een toast wanneer reCAPTCHA zelf niet geladen kon worden. */
  meldUitvoerenMislukt(error: unknown): void {
    console.error('Error executing captcha', error);
    this.toastr.error(
      'De beveiligingscontrole kon niet worden geladen. Vernieuw de pagina en probeer het opnieuw.',
      'Verificatie mislukt',
    );
  }

  private foutmelding(message?: string): string {
    if (message?.includes('score too low')) {
      return 'De beveiligingscontrole heeft uw aanvraag als verdacht beoordeeld. Probeer het opnieuw of neem telefonisch contact met ons op.';
    }

    return 'De beveiligingscontrole is niet geslaagd. Probeer het opnieuw.';
  }
}
