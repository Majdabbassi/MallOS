import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const PUBLIC_AUTH_PREFIX = `${environment.apiBaseUrl}/auth/`;

/**
 * Attaches the caller's Basic credentials to every backend request so the
 * server can derive the authenticated identity from the principal instead of
 * trusting a client-supplied header. The /auth/* endpoints stay public.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(PUBLIC_AUTH_PREFIX)) {
    return next(req);
  }

  const header = AuthService.getBasicAuthHeader();
  if (header) {
    req = req.clone({ setHeaders: { Authorization: header } });
  }
  return next(req);
};