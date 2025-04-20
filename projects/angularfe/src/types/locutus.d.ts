declare module 'locutus/php/strings/htmlspecialchars_decode' {
  export default function htmlspecialchars_decode(string: string, quoteStyle?: string | number): string;
}
declare module "locutus/php/strings/htmlspecialchars" {
  export default function htmlspecialchars(string?:any, quoteStyle?:any, charset?:any, doubleEncode?:any):any;
}
declare module "locutus/php/datetime/gmdate" {
  export default function gmdate(format?:any, timestamp?:any):any;
}
declare module "locutus/php/strings/nl2br" {
  export default function nl2br(str?:any, isXhtml?:any):any;
}
declare module "locutus/php/var/is_numeric" {
  export default function is_numeric(mixedVar?:any):any;
}
declare module "locutus/php/var/empty" {
  function empty(mixedVar?:any):any;
  export = empty;
}
declare module "locutus/php/strings/htmlentities" {
  function htmlentities(string?:any, quoteStyle?:any, charset?:any, doubleEncode?:any):any;
  export = htmlentities;
}
declare module "locutus/php/strings/explode" {
  function explode(...args:any[]):any;
  export = explode;
}
declare module "locutus/php/strings/implode" {
  function implode(...args:any[]):any;
  export = implode;
}
declare module "locutus/php/array/array_pop" {
  function array_pop(inputArr?:any):any;
  export = array_pop;
}
declare module "locutus/php/array/array_merge" {
  function array_merge(...args:any[]):any;
  export = array_merge;
}
declare module "locutus/php/var/isset" {
  function isset(...args:any[]):any;
  export = isset;
}
declare module "locutus/php/strings/html_entity_decode" {
  function html_entity_decode(string?:any, quoteStyle?:any):any;
  export = html_entity_decode;
}
