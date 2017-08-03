var mod_args = require('./args');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_dir = require('./dir');
var mod_xml2js = require('xml2js');

var xibSource = mod_args.args.argument(0, undefined);
var isFile = mod_dir.isFile(xibSource, ".xib");

function findFaulty() {

    if (this.subviews !== undefined) {

        this.subviews.forEach((sv, svIndex) => {

            sv.findFaulty();
        });
    }
}

mod_nibs.UIView.prototype.findFaulty = findFaulty;

function processXib(xibInstance, xibFile) {

    var objcs = xibInstance.document.objects[0];
    var keys = Object.keys(objcs);

    keys.forEach((key, keyIndex) => {

        var viewInstance = mod_nibs.viewInstance(key, objcs[key][0], xibFile);

        if (viewInstance !== undefined) {

            viewInstance.findFaulty();
        }
    });
}

if (mod_dir.isFile(xibSource, ".xib")) {

    var xibString = mod_fs.readFileSync(xibSource, "UTF-8");

    mod_xml2js.parseString(xibString, (err, xibInstance) => {

        processXib(xibInstance, xibSource);
    });
}
else if (mod_dir.FilePath.isDirectory(xibSource)) {

    var xibFolder = new mod_dir.Directory(xibSource);
    var xibs = xibFolder.filesWithExtension(".xib");

    xibs.forEach((xib, xibIndex) => {

        var xibString = mod_fs.readFileSync(xib, "UTF-8");
        mod_xml2js.parseString(xibString, (err, xibInstance) => {

            if (err != null) {

                console.log(err);
                process.exit(0);
            }
            if (xibInstance !== undefined && xibInstance.document !== undefined) {

                processXib(xibInstance, xib);
            }
        });
    });
}