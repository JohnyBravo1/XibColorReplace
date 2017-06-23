var mod_rgbHex = require('rgb-hex');

var mod_args = require('./args');

var args = mod_args.args;
var r = args.argument(0, 255);
var g = args.argument(1, 255);
var b = args.argument(2, 255);

var hex = mod_rgbHex(r-0, g-0, b-0);

console.log("#" + hex.toUpperCase());