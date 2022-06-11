import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import * as $ from 'jquery';

@Component({
  selector: 'app-notify-text',
  templateUrl: './notify-text.component.html',
  styleUrls: ['./notify-text.component.css']
})
export class NotifyTextComponent implements OnInit, OnChanges {

  @Input() showText = '';

  showNumber = <number>0;

  constructor() { }

  ngOnInit(): void {
    this.showNumber = parseInt(this.showText);
  }

  flashText() {
    this.showNumber = parseInt(this.showText);
    $('span.notify-text-note').css('opacity', 1);
    setTimeout(()=>{
      $('span.notify-text-note').css('opacity', 0);
    },1500);
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('in ngOnChanges');

    this.flashText();
  }
}
