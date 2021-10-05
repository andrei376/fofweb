import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  content?: string;
  sidebar?: string;
  unread?: number;
  starred?: number;
  tagstbl?: string;

  // readonly API_URL = 'http://localhost:3080';
  readonly API_URL = '/api';

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.userService.getUserBoard().subscribe(
      data => {
        this.content = data;
      },
      err => {
        this.content = JSON.parse(err.error).message;
      }
    );
    this.userService.getTagsTable().subscribe(
      data => {
        console.log(data);
        this.tagstbl = data;
      },
      err => {
        alert(JSON.parse(err.error).message);
      }
    );
    this.userService.getSidebar().subscribe(
      data => {
        // console.log(data);
        let $unread = 0;
        let $starred = 0;
        let $total = 0;
        let $n = 0;

        for (let $r in data) {
          let $row = data[$r];

          //console.log($row);
          $n++;
          $unread += $row['feed_unread'];
          $starred += $row['feed_starred'];
          $total += $row['feed_items'];
        }
        this.sidebar = data;

        this.unread = $unread;
        this.starred = $starred;

      },
      err => {
        alert(JSON.parse(err.error).message);
      }
    );
  }
}
