import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class FakeLatencyInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Add fake delay of 300-600ms to simulate network latency
    const delayMs = Math.floor(Math.random() * 300) + 300;
    return next.handle(request).pipe(delay(delayMs));
  }
}
