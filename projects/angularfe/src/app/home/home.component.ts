import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  content?: string;
  sidebar?: any;
  unread?: number;
  starred?: number;
  tagstbl?: string;
  column_class?: any;
  columns?: any;
  name?: any;
  title?: any;
  direction?: string;
  order?: string;
  Object = Object;
  fof_asset?: any;

  what?: any;
  how?: any;
  feed?: any;
  search?: any;
  when?: any;
  which?: any;
  howmany?: any;

  // readonly API_URL = 'http://localhost:3080';
  readonly API_URL = '/api';

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.direction = 'desc';
    this.order = 'feed_unread';

    this.what = 'unread';
    this.how = 'paged';
    this.feed = null;
    this.search = null;
    this.when = null;
    this.which = 0;
    this.howmany = 5;

    this.fof_asset= {
      'feed_icon': 'image/feed-icon.png'
    };

    this.column_class = {
      'feed_age': 'update',
      'max_date': 'latest',
      'feed_unread': 'unread',
      'feed_url': 'source',
      'feed_title': 'title'
    };

    this.columns = [
      'feed_age',
      'max_date',
      'feed_unread',
      'feed_url',
      'feed_title'
    ];

    this.name = {
      'feed_age': 'age',
      'max_date': 'latest',
      'feed_unread': '<span class="unread">#</span>',
      'feed_url': 'feed',
      'feed_title': 'title',
      'null': ''
    };

    this.title = {
      'feed_age': 'sort by last update time',
      'max_date': 'sort by last new item',
      'feed_unread': 'sort by number of unread items',
      'feed_url': 'sort by feed URL',
      'feed_title': 'sort by feed title',
      'null': ''
    };






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
