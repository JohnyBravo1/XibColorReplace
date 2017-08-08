var mod_args = require('./args');
var mod_dir = require('./dir');
var mod_nibs = require('./nibs');
var mod_fs = require('fs');
var mod_xml2js = require('xml2js');

var input = mod_args.args.argument(0, undefined);
var userAttribKey = mod_args.args.argument(1, "keyPath");

function processXibFile(xibFile) {

    var xibString = mod_fs.readFileSync(xibFile);

    if (xibString !== undefined && xibString.length > 0) {

        mod_xml2js.parseString(xibString, (err, xibInstance) => {

            if (xibInstance.document === undefined || xibInstance.document.objects === undefined) {

                return;
            }
            var objcs = xibInstance.document.objects[0];
            var objKeys = Object.keys(objcs);

            objKeys.forEach((xibKey, xibKeyIndex) => {

                var viewInstance = mod_nibs.viewInstance(xibKey, objcs[xibKey][0], xibFile);

                if (viewInstance !== undefined) {

                    var attribs = viewInstance.findUDAttribute(userAttribKey, xibInstance);
                    var constraints = viewInstance.findFaultyConstraints(xibInstance);

                    if (attribs.length > 0 || constraints.length > 0) console.log(xibFile);
                    if (attribs.length > 0) console.log(attribs);
                    if (constraints.length > 0) console.log(constraints);
                }
            });
        });
    }
}

if (mod_dir.isDirectory(input)) {

    var dir = new mod_dir.Directory(input);
    var files = dir.filesWithExtension(".xib", true);

    files.forEach((xibFile, xibFileIndex) => {

        processXibFile(xibFile);
    });
}
else if (mod_dir.isFile(input)) {

    processXibFile(input);
}