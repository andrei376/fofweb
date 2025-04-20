import { Pipe, PipeTransform } from '@angular/core';

//const nl2br = require('locutus/php/strings/nl2br');
import nl2br from 'locutus/php/strings/nl2br';

@Pipe({
  name: 'nl2br'
})
export class Nl2brPipe implements PipeTransform {

  transform(value: any): any {
    return nl2br(value);
  }

}
