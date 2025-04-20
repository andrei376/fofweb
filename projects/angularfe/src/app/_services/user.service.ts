import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// const API_URL = 'http://localhost:8080/api/test/';
const API_URL = '/api/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

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

  getSidebar(order: any, direction: any): Observable<any> {
    return this.http.post(API_URL + 'feeds', {
      order,
      direction
    }, { responseType: 'json' });
  }

  getTagsTable(): Observable<any> {
    return this.http.get(API_URL + 'tagstbl', { responseType: 'json' });
  }

  markRead(id: any): Observable<any> {
    return this.http.post(
      API_URL + 'mark_read',
      {
        id
      },
      { responseType: 'json' }
    );
  }

  delTag(tag: any): Observable<any> {
    return this.http.post(
      API_URL + 'del_tag',
      {
        tag
      },
      { responseType: 'json' }
    );
  }

  getFeedName(id: any): Promise<any> {
    return this.http.post(
      API_URL + 'feedname',
      {
        id
      },
      { responseType: 'json' }
    ).toPromise();
  }

  markStar(id: any, remove: boolean): Observable<any> {
    return this.http.post(
      API_URL + 'toggle_fav',
      {
        id,
        remove
      },
      { responseType: 'json' }
    );
  }

  getItems(feed: any, what: any, when: any, which: any, howmany: any, how: any, order: any, search: any): Observable<any> {
    return this.http.post(API_URL + 'items', {
      feed,
      what,
      when,
      which,
      howmany,
      how,
      order,
      search
    }, { responseType: 'json' });
  }

  getItemCount(what: any, feed: any): Observable<any> {
    return this.http.post(API_URL + 'itemcount', {
      what,
      feed
    }, { responseType: 'json' });
  }
}
