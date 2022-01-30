import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, filter, take, switchMap } from "rxjs/operators";
import { Observable, throwError } from 'rxjs';
import { TokenStorageService } from './_services/token-storage.service';

const TOKEN_HEADER_KEY = 'Authorization';       // for Spring Boot back-end

@Injectable({
  providedIn: 'root'
})

export class AuthInterceptorService implements HttpInterceptor {
  constructor(private token: TokenStorageService, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log("Interception In Progress"); // Interception Stage

    let authReq = req;
    const token = this.token.getToken();
    if (token != null) {
      authReq = req.clone({ headers: req.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token) });
    }
    // const token: string | null = localStorage.getItem('token'); // This retrieves a token from local storage
    // req = req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) });// This clones HttpRequest and Authorization header with Bearer token added
    // req = req.clone({ headers: req.headers.set('Content-Type', 'application/json') });
    // req = req.clone({ headers: req.headers.set('Accept', 'application/json') });

    return next.handle(authReq)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // Catching Error Stage
          if (error && error.status === 401) {
            console.log("ERROR 401 UNAUTHORIZED") // in case of an error response the error message is displayed
            this.router.navigateByUrl('/login');
          }
          const err = error.error.message || error.statusText;
          return throwError(error); // any further errors are returned to frontend
        })
      );
  }
}
