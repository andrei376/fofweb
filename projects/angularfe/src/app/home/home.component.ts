import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  // readonly API_URL = 'http://localhost:3080';
  readonly API_URL = '/api';

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {
  }

  signIn() {
    this.http.get(this.API_URL + '/token/sign')
      .subscribe(
        (res) => {
          if ((res as any).token) {
            localStorage.setItem('token', (res as any).token); //token here is stored in a local storage
          }
        },
        (err) => {
          console.log(err);
        }
      );
  }

  getPath() {
    this.http.get(this.API_URL + '/path1') //path1 is then requested
      .subscribe(
        (res) => {
          console.log(res);
        },
        (err) => {
          console.log(err);
        }
      );
  }
}
