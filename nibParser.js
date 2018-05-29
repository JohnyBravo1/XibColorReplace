var mod_dir = require('./dir.js');
var mod_fs = require('fs');
var mod_nibs = require('./nibs.js');
var mod_xml2js = require('xml2js');

var unknownElementTypes = [ 'placeholder', 'screenEdgePanGestureRecognizer', 'tapGestureRecognizer', 'swipeGestureRecognizer' ];

var projectDir = process.argv[2];

if (projectDir == undefined) {
    projectDir = process.env['HOME'] + "/Projects/";
}

var xibs = new mod_dir.Directory(projectDir).filesWithExtension(".xib", true);
var storyboards = new mod_dir.Directory(projectDir).filesWithExtension(".storyboard", true);

clearColors();

storyboards.forEach((storyBoard, storyBoardIndex) => {

    console.log("PARSING: " + storyBoard);
    console.log("-----------------");

    var xibContent = mod_fs.readFileSync(storyBoard);
    var xmlParser = new mod_xml2js.Parser();

    xmlParser.parseString(xibContent, (err, xibObject) => {

        xibContent = undefined;
        if (err === null) writeStoryboardColors(xibObject, storyBoard);
        else console.log("failed to parse " + mod_dir.lastPathComponent(storyBoard) + ":" + err);
    });
});

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

function writeStoryboardColors(xibObject, xibFile) {

    if (xibObject.document === undefined || xibObject.document.scenes === undefined) {

        return;
    }

    var scenes = xibObject.document.scenes[0].scene;

    scenes.forEach((scene, sceneIndex) => {

        scene.objects.forEach((object, objectIndex) => {

            var objKeys = Object.keys(object);

            var parsed = false;
            objKeys.forEach((key, index) => {

                var viewInstance = mod_nibs.viewInstance(key, object[key][0], xibFile);

                if (viewInstance !== undefined) {

                    viewInstance.outputColor();
                }
                else if (key.toLowerCase().indexOf("controller") !== -1) {

                    var controller = object[key][0];
                    var controllerKeys = Object.keys(controller);

                    controllerKeys.forEach((key, index) => {

                        var viewInstance = mod_nibs.viewInstance(key, controller[key][0], xibFile);

                        if (viewInstance !== undefined) {

                            viewInstance.outputColor();
                        }
                        else if (unknownElementTypes.indexOf(key) === -1) {

                            console.log("===>> UNKNOWN ELEMENT: " + key);
                        }
                    });
                }
                else if (unknownElementTypes.indexOf(key) === -1) {

                    console.log("===>> UNKNOWN ELEMENT: " + key);
                }
            });
        });
    });
}

function writeColors(xibObject, xibFile) {

    //something else going on here...
    if (xibObject.document === undefined || xibObject.document.objects === undefined) {

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
        else if (unknownElementTypes.indexOf(key) === -1) {
            console.log("===>> UNKNOWN ELEMENT: " + key);
        }
    });
}
