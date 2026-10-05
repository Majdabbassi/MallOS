import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const PUBLIC_AUTH_PREFIX = `${environment.apiBaseUrl}/auth/`;

/**
 * Attaches the session's bearer token to every backend request. The /auth/*
 * endpoints stay public so login/register work before a session exists.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(PUBLIC_AUTH_PREFIX)) {
    return next(req);
  }

  const token = AuthService.getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};