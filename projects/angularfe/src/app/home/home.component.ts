import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import { UserService } from '../_services/user.service';
import * as $ from "jquery";


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
  tagsjson?: any;
  column_class?: any;
  columns?: any;
  name?: any;
  title?: any;
  direction?: string;
  olddirection?: string;
  order?: any;
  oldorder?: any;
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

  debugMsg(text: any): void {
    alert(text);
  }

  del_tag(tag: any): boolean {
    if (confirm('Untag all [' + tag + '] items -- are you SURE?')) {
      this.delete_tag(tag);
    }
    return false;
  }

  delete_tag(tag: any): boolean {
    this.userService.delTag(tag).subscribe(
      data => {
        this.refreshList();

        return true;
      },
      err => {
        alert(JSON.parse(err.error).message);
      }
    );

    return false;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.getFeeds(
      this.order,
      this.direction
    );
  }

  ngDoCheck() {
    if (this.direction != this.olddirection ||
        this.order != this.oldorder
    ) {
      this.olddirection = this.direction;
      this.oldorder = this.order;

      this.getFeeds(
        this.order,
        this.direction
      );
    }
  }

  refreshList() {
    this.getTagsTable();

    this.getFeeds(
      this.order,
      this.direction
    );

  }

  getTagsTable() {
    this.userService.getTagsTable().subscribe(
      data => {
        this.tagsjson = data.tagsjson;
      },
      err => {
        alert(JSON.parse(err.error).message);
      }
    );
  }

  getFeeds(order: any, direction: any) {
    this.userService.getSidebar(order, direction).subscribe(
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

        this.how = 'paged';

        if ($unread > 0) {
          document.title = '(' + $unread + ') Feed on Feeds';
        }
      },
      err => {
        alert(JSON.parse(err.error).message);
      }
    );
  }

  ngOnInit(): void {
    this.direction = 'desc';
    this.order = 'feed_unread';

    this.olddirection = this.direction;
    this.oldorder = this.order;

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
      'feed_title': 'title'
    };

    this.title = {
      'feed_age': 'sort by last update time',
      'max_date': 'sort by last new item',
      'feed_unread': 'sort by number of unread items',
      'feed_url': 'sort by feed URL',
      'feed_title': 'sort by feed title'
    };


    this.userService.getUserBoard().subscribe(
      data => {
        this.content = data;
      },
      err => {
        this.content = JSON.parse(err.error).message;
      }
    );

    this.getTagsTable();

    this.getFeeds(
      this.order,
      this.direction
    );
  }
}
