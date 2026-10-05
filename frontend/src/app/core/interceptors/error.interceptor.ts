import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UIService } from '../services/ui.service';

/** Set on calls whose failure is expected (an optional panel the user may not be allowed to see): no toast. */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

const PUBLIC_AUTH_PREFIXES = ['/auth/login', '/auth/register'];

function extractMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the server. Please check your connection.';
  }
  const body = error.error as { message?: string } | null;
  return body?.message || error.message || 'Something went wrong. Please try again.';
}

/**
 * Global error handling: surfaces a single toast for every failed API call
 * using the backend's structured error body when available, then rethrows so
 * callers can still react (e.g. reset loading state) if they want.
 *
 * /auth/* failures are skipped because the login page already renders its own
 * inline error message — showing a toast there would be redundant.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublicAuth = PUBLIC_AUTH_PREFIXES.some(prefix => req.url.includes(prefix));
  if (isPublicAuth) {
    return next(req);
  }

  const ui = inject(UIService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error instanceof HttpErrorResponse && !req.context.get(SILENT_ERRORS)) {
        ui.showError(extractMessage(error));
      }
      return throwError(() => error);
    })
  );
};