import { Pipe, PipeTransform } from '@angular/core';

//const htmlspecialchars = require('locutus/php/strings/htmlspecialchars');
import htmlspecialchars from 'locutus/php/strings/htmlspecialchars';

@Pipe({
    name: 'htmlspecialchars',
    standalone: false
})
export class HtmlspecialcharsPipe implements PipeTransform {

  transform(value: any): any {
    return htmlspecialchars(value);
  }

}
