var mod_args = require('./args');
var mod_hex = require('rgb-hex');
var mod_rgb = require('hex-rgb');

if (mod_args.args.argsLength == 1) {

    var hex = mod_args.args.argument(0, "000000");
    var rgb = mod_rgb(hex);

    console.log(hex + " => " + rgb);
    process.exit(0);
}
else {

    var r = mod_args.args.argument(0, 255.0) - 0;
    var g = mod_args.args.argument(1, 255.0) - 0;
    var b = mod_args.args.argument(2, 255.0) - 0;
    var a = mod_args.args.argument(3, 1.0) - 0;

    a = (a > 1.0 ? 1.0 : a);
    var hex = mod_hex(r, g, b, a);
    console.log(mod_args.args + "=>" + hex.toUpperCase());
}