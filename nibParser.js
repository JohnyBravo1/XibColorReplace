var mod_dir = require('./../dir.js');
var mod_fs = require('fs');
var mod_nibs = require('./nibs.js');
var mod_xml2js = require('xml2js');

var projectDir = process.argv[2];

if (projectDir == undefined) {
    projectDir = process.env['HOME'] + "/Projects/";
    // projectDir = "/Users/Johan/Desktop/Temp/";
}

var xibs = new mod_dir.Directory(projectDir).filesWithExtension(".xib", true);

clearColors();

xibs.forEach((xib, xibIndex) => {

    console.log("PARSING: " + xib);
    console.log("-----------------");
    var xibContent = mod_fs.readFileSync(xib);
    var xmlParser = new mod_xml2js.Parser();

    xmlParser.parseString(xibContent, (err, xibObject) => {

        xibContent = undefined;
        if (err === null) writeColors(xibObject, xib);
        else console.log("failed to parse " + mod_dir.lastPathComponent(xib) + ":" + err);
    });
});

function clearColors() {

    if (mod_fs.existsSync("./colors")) {

        var files = mod_fs.readdirSync("./colors");
        files.forEach((file, fileIndex) => {

            mod_fs.unlinkSync("./colors/" + file);
        });
        console.log("CLEARED " + files.length + " COLOR OUTPUTS");
    }
}

function writeColors(xibObject, xibFile) {

    //something else going on here...
    if (xibObject.document === undefined) {
        return;
    }

    var objs = xibObject.document.objects[0];
    var objKeys = Object.keys(objs);

    var parsed = false;
    objKeys.forEach((key, index) => {

        var viewInstance = mod_nibs.viewInstance(key, objs[key][0], xibFile);

        if (viewInstance !== undefined) {
            viewInstance.outputColor();
        }
        else {
            console.log("===>> UNKNOWN ELEMENT: " + key);
        }
    });
}