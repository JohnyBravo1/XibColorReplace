var mod_args = require('./args');
var mod_hex = require('rgb-hex');

var r = mod_args.args.argument(0, 255.0) - 0;
var g = mod_args.args.argument(1, 255.0) - 0;
var b = mod_args.args.argument(2, 255.0) - 0;
var a = mod_args.args.argument(3, 1.0) - 0;

console.log(r);
console.log(g);
console.log(b);
console.log(a);

a = (a > 1.0 ? 1.0 : a);
var hex = mod_hex(r, g, b, a);

console.log(mod_args.args + "=>" + hex.toUpperCase());