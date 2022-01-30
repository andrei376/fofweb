import { Pipe, PipeTransform } from '@angular/core';

const gmdate = require('locutus/php/datetime/gmdate');

@Pipe({
  name: 'gmdate'
})
export class GmdatePipe implements PipeTransform {

  transform(value: any, format: any): any {
    return gmdate(format, value);
  }

}
