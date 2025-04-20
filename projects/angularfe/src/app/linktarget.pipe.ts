import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'linktarget',
    standalone: false
})
export class LinktargetPipe implements PipeTransform {

  transform(value: any): any {
    let val = (""+value).replace(/<a\s+href=/gi, '<a target="_blank" href=');

    return val;
  }

}
