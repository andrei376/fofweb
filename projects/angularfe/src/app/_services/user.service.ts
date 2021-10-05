import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// const API_URL = 'http://localhost:8080/api/test/';
const API_URL = '/api/';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getPublicContent(): Observable<any> {
    return this.http.get(API_URL + 'test/all', { responseType: 'text' });
  }

  getUserBoard(): Observable<any> {
    return this.http.get(API_URL + 'test/user', { responseType: 'text' });
  }

  getSidebar(): Observable<any> {
    return this.http.get(API_URL + 'feeds', { responseType: 'json' });
  }

  getTagsTable(): Observable<any> {
    return this.http.get(API_URL + 'tagstbl', { responseType: 'text' });
  }
}
