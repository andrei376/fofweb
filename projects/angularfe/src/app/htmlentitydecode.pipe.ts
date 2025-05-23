import { Pipe, PipeTransform } from '@angular/core';

//const html_entity_decode = require("locutus/php/strings/html_entity_decode");
import html_entity_decode from 'locutus/php/strings/html_entity_decode';

@Pipe({
    name: 'htmlentitydecode',
    standalone: false
})

export class HtmlentitydecodePipe implements PipeTransform {

  transform(value: any): any {
    return html_entity_decode(value);
  }

}
