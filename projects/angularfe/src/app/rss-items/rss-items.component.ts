import {Component, DoCheck, Input, Output, OnChanges, OnInit, SimpleChanges, EventEmitter} from '@angular/core';
import {UserService} from "../_services/user.service";
import $ from 'jquery';
//const is_numeric = require('locutus/php/var/is_numeric');
import is_numeric from 'locutus/php/var/is_numeric';

//const empty = require('locutus/php/var/empty');
import empty from 'locutus/php/var/empty';

//const htmlentities = require('locutus/php/strings/htmlentities');
import htmlentities from "locutus/php/strings/htmlentities";

//const explode = require('locutus/php/strings/explode');
import explode from 'locutus/php/strings/explode';

//const implode = require('locutus/php/strings/implode');
import implode from 'locutus/php/strings/implode';

//const array_pop = require('locutus/php/array/array_pop');
import array_pop from 'locutus/php/array/array_pop';

//const array_merge = require('locutus/php/array/array_merge');
import array_merge from "locutus/php/array/array_merge";

//const isset = require('locutus/php/var/isset');
import isset from 'locutus/php/var/isset';


@Component({
    selector: 'app-rss-items',
    templateUrl: './rss-items.component.html',
    styleUrls: ['./rss-items.component.css'],
    standalone: false
})
export class RssItemsComponent implements OnInit, DoCheck, OnChanges {

  @Input() feed = '';
  @Input() what = 'unread';
  @Input() when = '';
  @Input() which = <any>0;
  @Input() howmany = 5;
  @Input() how = 'paged';
  @Input() order = 'feed_unread';
  @Input() search = '';

  @Output() readEvent: EventEmitter<any> = new EventEmitter();
  @Output() starEvent: EventEmitter<any> = new EventEmitter();
  @Output() howChange: EventEmitter<string> = new EventEmitter();

  content?: any;
  items?: any;
  fof_asset?: any;
  itemcount?: any;
  oldwhich?: any;
  oldhow?: string;

  display_summary?: any;
  navlinks?: any;

  ajaxIsRunning?: boolean;

  math?: any;




  constructor(
    private userService: UserService
  ) {
  }

  debugMsg(text: any): void {
    alert(text);
  }

  async getFeedName(id: any): Promise<any> {
    const data = await this.userService.getFeedName(id);

    return data;
  }

  loadMore(): boolean {
    //load 1 more only if paged

    //actually it does refresh the current page

    this.getItems(
      this.feed,
      this.what,
      this.when,
      this.which,
      this.howmany,
      this.how,
      this.order,
      this.search
    );

    return false;
  }

  markRead(id: any): boolean {
    this.ajaxIsRunning = true;
    this.userService.markRead(id).subscribe(
      data => {
        let item = $('#i' + id);

        let y = item.offset()?.top ?? 0;

        window.scrollTo(0, y - 10);
        item.remove();

        this.readEvent.emit(id);

        this.ajaxIsRunning = false;
        this.loadMore();
        return true;
      },
      err => {
        alert(JSON.parse(err.error).message);
      }
    );

    this.ajaxIsRunning = false;
    return false;
  }

  consoleLog(id: any): void {
    console.log(id);
  }

  toggleFav(id: any, remove: boolean): boolean {

    this.userService.markStar(id, remove).subscribe(
      data => {
        this.starEvent.emit(id);
        if (!this.ajaxIsRunning) {
          this.getItems(
            this.feed,
            this.what,
            this.when,
            this.which,
            this.howmany,
            this.how,
            this.order,
            this.search
          );
        }
      },
      err => {
        alert(JSON.parse(err.error).message);
      }
    );

    return true;
  }

  ngOnInit(): void {
    this.ajaxIsRunning = false;
    this.math = Math;
    this.itemcount = 0;

    this.fof_asset= {
      'feed_icon': 'image/feed-icon.png'
    };

    this.oldwhich = this.which;
    this.oldhow = this.how;
    this.navlinks = <any>[];
  }

  ngOnChanges(changes: SimpleChanges) {
    this.which = 0;

    if (this.how == 'unpaged') {
      this.which = null;
    }

    // console.log('in ngOnChanges');

    if (!this.ajaxIsRunning) {
      this.getItems(
        this.feed,
        this.what,
        this.when,
        this.which,
        this.howmany,
        this.how,
        this.order,
        this.search
      );
    }
  }

  ngDoCheck() {
    if (this.which != this.oldwhich || this.how != this.oldhow) {
      this.oldwhich = this.which;
      this.oldhow = this.how;

      if (this.how == 'unpaged') {
        this.which = null;
      }

      // console.log('in do check');

      if (!this.ajaxIsRunning) {
        this.getItems(
          this.feed,
          this.what,
          this.when,
          this.which,
          this.howmany,
          this.how,
          this.order,
          this.search
        );
      }
    }
  }

  async getItems(feed: any, what: any, when: any, which: any, howmany: any, how: any, order: any, search: any) {
    this.ajaxIsRunning = true;

    this.userService.getItemCount(what, feed).subscribe(
      async data => {
        this.itemcount = 0;
        this.display_summary = '';
        this.navlinks = '';

        for (let i in data) {
          let $row = data[i];

          this.itemcount += $row['count'];
        }

        // console.log('itemcount=', this.itemcount);

        if( this.itemcount < (howmany * 2) && (this.itemcount > howmany) ) {
          howmany = howmany * 2;
        }

        this.display_summary = await this.fof_view_title(feed, what, when, which, howmany, search, this.itemcount);
        this.navlinks = this.fof_get_nav_links(feed, what, when, which, howmany, search, this.itemcount);

        this.userService.getItems(
          feed,
          what,
          when,
          which,
          howmany,
          how,
          order,
          search).subscribe(
          data => {
            let $rows = [];

            for (let i in data) {
              $rows.push(data[i]);
            }

            this.items = $rows;

            this.ajaxIsRunning = false;
          },
          err => {
            this.content = JSON.parse(err.error).message;
            this.ajaxIsRunning = false;
          },
          () => {
            this.ajaxIsRunning = false;
          }
        );
      }, err => {
        alert(JSON.parse(err.error).message);
        this.ajaxIsRunning = false;
      },
      () => {
        this.ajaxIsRunning = false;
      }
    );
  }

  // $feed=NULL, $what='unread', $when=NULL, $start=NULL, $limit=NULL, $search=NULL, $itemcount = 0
  // $feed: any, $what: any,     $when: any, $which: any, $howmany: any, $search: any, $itemcount: any
  async fof_view_title($feed: any = null, $what: any = 'unread', $when: any = null, $start: any = null, $limit: any = null, $search: any = null, $itemcount: any = 0) {
    let $prefs = <any>[];
    let $tags = <any>[];
    let $last_tag;
    let $feed2 = <any>[];

    let $end = 0;

    $prefs['howmany'] = 5;


    let $title = 'feed on feeds - showing';

    if ($itemcount) {
      if (is_numeric($start)) {
        if ( ! is_numeric($limit)) {
          $limit = $prefs['howmany'];
        }

        if ($start || $limit < $itemcount) {
          $end = $start + $limit;
          if ($end > $itemcount) {
            $end = $itemcount;
          }

          $start += 1;
          if ($start != $end) {
            $title += " " + $start + " to " + $end + " of ";
          }
        }
      }

      $title += " " + $itemcount;
    } else {
      $title += " " + $itemcount;
    }

    $title += ' item' + ($itemcount != 1 ? 's' : '');

    if ( ! empty($feed)) {
      /* we only need this one thing here, so try to minimize activity by shirking the full fix function call */
      // $feed = fof_db_subscription_feed_get(fof_current_user(), $feed);
      // $feed2['feed_title'] = this.getFeedName($feed);
      $feed2 = await this.getFeedName($feed);

      // console.log('feed2=', $feed2);

      $title += ' in \'' + ($feed2['display_title']) + '\'';
    }

    if (empty($what)) {
      $what = 'unread';
    }

    if ($what != 'all') {
      $tags = explode(' ', $what);
      $last_tag = array_pop($tags);
      if ( ! empty($last_tag)) {
        $title += ' tagged';
        if ( ! empty($tags)) {
          $title += ' ' + implode(', ', $tags) + ($tags.length > 1 ? ',' : '') + ' and';
        }
        $title += ' ' + $last_tag;
      }
    }

    /*if ( ! empty($when)) {
      $title += ' from ' + $when;
    }*/

    /*if (isset($search)) {
      $title .= ' <a href="#" title="Toggle highlights" onclick="toggle_highlight(); return false;">matching <span class="highlight"><em>' . $search . '</em></span></a>';
    }*/

    return $title;
  }

  fof_get_nav_links($feed: any = null, $what: any ='new', $when: any = null, $start: any = null, $limit: any = null, $search: any = null, $itemcount: any = 9999) {
    let $prefs = <any>[];
    let $navlinks = <any>[];

    $prefs['howmany'] = 5;

    let $qv = {
      'feed': $feed,
      'what': $what,
      'when': $when,
      'search': $search,
      'howmany': $limit,
      'how': 'paged'
    };

    if (is_numeric($start)) {
      if ( ! is_numeric($limit)) {
        $limit = isset($prefs['howmany']) ? $prefs['howmany'] : null;
        $qv['howmany'] = $limit;
      }

      if ($itemcount <= $limit) {
        return '';
      }

      let $earlier = $start + $limit;
      let $later = $start - $limit;

      // $qv['how'] = 'paged';

      if($itemcount > $earlier) {
        $navlinks.push(array_merge($qv, {'which': $earlier, 'title': "[&laquo; previous " + $limit + "]"}));
        $navlinks.push(array_merge($qv, {'how': 'unpaged', 'title': "[all-at-once]"}));

        // $navlinks += ' <a href="' . fof_url('.', array_merge($qv, array('which' => $earlier))) . '">[&laquo; previous ' . $limit . ']</a>';
        // $navlinks += ' <a href="' . fof_url('.', array_merge($qv, array('how' => 'unpaged'))) . '">[all-at-once]</a>';
      }

      if($later >= 0) {
        $navlinks.push(array_merge($qv, {'which': $later, 'title': "[next " + $limit + " &raquo;]"}));

        // $navlinks .= ' <a href="' . fof_url('.', array_merge($qv, array('which' => $later))) . '">[next ' . $limit . ' &raquo;]</a>';
      }
    }

    return $navlinks;
  }
}
