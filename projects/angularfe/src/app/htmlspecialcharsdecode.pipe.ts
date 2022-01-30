import { Pipe, PipeTransform } from '@angular/core';

const htmlspecialchars_decode = require('locutus/php/strings/htmlspecialchars_decode');

@Pipe({
  name: 'htmlspecialcharsdecode'
})

export class HtmlspecialcharsdecodePipe implements PipeTransform {

  transform(value: any): any {
    return htmlspecialchars_decode(value);
  }

}
