const _ = require('./logger');
const mod_dir = require('./dir');
const mod_fs = require('fs');
const mod_nibs = require('./nibs');
const mod_xml2js = require('xml2js');

const homeDir = mod_dir.FilePath.specialPath("$HOME");
const projectDir = homeDir + "/Projects/Swift/WizzPass";
const unknownElementTypes = [ 'placeholder', 'screenEdgePanGestureRecognizer', 'tapGestureRecognizer', 'swipeGestureRecognizer' ];

const dir = new mod_dir.Directory(projectDir);

var uis = [];
var uis = dir.filesWithExtension("storyboard", true);
// uis = uis.concat(dir.filesWithExtension("xib", true));

var outputPath = mod_dir.FilePath.specialPath("$DESKTOP");

mod_nibs.UIView.prototype.hasChanges = function() { return (true); };
mod_nibs.UIViewController.hasChanges = function() { return (true); };

function processObjects(objects, xmlInstance, xmlFile, sceneIndex) {

    var keys = Object.keys(objects);
    var isStoryboard = xmlFile.endsWith("storyboard");
    
    keys.forEach((key, index) => {

        var xibInstance = objects[key][0];
        var instance = (isStoryboard ? mod_nibs.controllerInstance(key, xibInstance, xmlFile) : mod_nibs.viewInstance(key, xibInstance, xmlFile));

        if (instance !== undefined) {

            mod_fs.writeFileSync(outputPath + "/" + instance.xibName);
            if (instance.setupXMLPath !== undefined) {

                instance.setupXMLPath(sceneIndex);
            }
            instance.theme("primary");
            applyTheme(xmlInstance, instance);
        }
        else if (unknownElementTypes.indexOf(key) === -1) {

            _.warning("===>> UNKNOWN ELEMENT: " + key);
        }
    });
}

function applyTheme(xmlInstance, viewInstance) {

    var xibView = undefined;

    if (viewInstance.viewFromXibInstance !== undefined) {

        xibView = viewInstance.viewFromXibInstance(xmlInstance);
    }
    else {

        xibView = viewInstance.controllerFromXibInstance(xmlInstance);
    }

    if (xibView === undefined) {

        _.warning("UNABLE TO PARSE XIB VIEW FROM PATH: " + viewInstance.xmlPath);
        return;
    }
    if (viewInstance.userDefinedRuntimeAttributes !== undefined) {

        xibView.userDefinedRuntimeAttributes = viewInstance.userDefinedRuntimeAttributes;
    }
    if (viewInstance.prototypes !== undefined) {

        viewInstance.prototypes.forEach((cell, cellIndex) => {

            applyTheme(xmlInstance, cell);
        });
    }
    if (viewInstance.views !== undefined) {

        viewInstance.views.forEach((view, viewIndex) => {

            applyTheme(xmlInstance, view);
        });
    }
    else if (viewInstance.subviews !== undefined) {

        viewInstance.subviews.forEach((subview, subviewIndex) => {

            applyTheme(xmlInstance, subview);
        });
    }

    //only write changes made from the parent view instance
    if (viewInstance.xibName != "" && viewInstance.xmlPath.indexOf("subview") === -1) {

        var destinationPath = outputPath + "/" + viewInstance.xibName;

        // _.info(destinationPath);
        // console.log(xmlInstance.document.scenes[0].scene[0].objects[0].viewController[0].view[0].subviews[0].imageView[0].userDefinedRuntimeAttributes.userDefinedRuntimeAttribute[0]);
        // process.exit(0);

        var builder = new mod_xml2js.Builder();
        var xml = builder.buildObject(xmlInstance).toString();

        mod_fs.writeFile(destinationPath, xml, (err) => {

            if (err !== null) _.error(err, "applyTheme [" + destinationPath + "]:");
            else _.success("SUCCESSFULLY THEMED", "[" + destinationPath + "]");
        });
    }
}

function processXMLInstance(xmlInstance, xmlFile) {

    var scenes = "";

    //something else going on here...
    if (xmlInstance.document === undefined) {

        return;
    }

    if (xmlInstance.document.objects !== undefined) {

        var objects = xmlInstance.document.objects[0];

        processObjects(objects, xmlInstance, xmlFile);
    }
    else if (xmlInstance.document.scenes !== undefined) {

        let scenes = xmlInstance.document.scenes[0].scene;

        scenes.forEach((scene, sceneIndex) => {

            processObjects(scene.objects[0], xmlInstance, xmlFile, sceneIndex);
        });
    }
}

uis.forEach((uiFile, uiIndex) => {

    var uiContent = mod_fs.readFileSync(uiFile);
    mod_xml2js.parseString(uiContent.toString(), (err, xmlInstance) => {

        if (err === null) {

            processXMLInstance(xmlInstance, uiFile);
        }
        else {

            _.error(err, "uis.forEach:");
        }
    });
});