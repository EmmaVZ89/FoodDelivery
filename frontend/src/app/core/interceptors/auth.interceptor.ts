import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  let authReq = req;
  if (token && !req.url.includes('/auth/')) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        const refreshObs = authService.refreshToken();
        if (refreshObs) {
          return refreshObs.pipe(
            switchMap((res) => {
              authService.updateStoredTokens(res.accessToken, res.refreshToken);
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              });
              return next(retryReq);
            }),
            catchError(() => {
              authService.logout();
              return throwError(() => error);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
