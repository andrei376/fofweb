import { Pipe, PipeTransform } from '@angular/core';

import htmlspecialchars_decode from 'locutus/php/strings/htmlspecialchars_decode';

@Pipe({
    name: 'htmlspecialcharsdecode',
    standalone: false
})

export class HtmlspecialcharsdecodePipe implements PipeTransform {

  transform(value: any): any {
    return htmlspecialchars_decode(value);
  }

}
