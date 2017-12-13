#!/usr/local/bin/node

var mod_args = require('./args');
var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_xml2js = require('xml2js');

var path = mod_args.args.fileArgument();

if (path === undefined || path.length == 0) {

    path = mod_dir.FilePath.specialPath("$HOME/Projects/WizzPass/ErnstYoung/earnst-young");
}

var dir = new mod_dir.Directory(path);

var xibs = dir.filesWithExtension("xib", true);
var storyboards = dir.filesWithExtension("storyboard", true);

xibs.forEach((xibFile, xibIndex) => {

    // processXibFile(xibFile);
});

storyboards.forEach((storyboardFile, storyboardIndex) => {

    processStoryboardFile(storyboardFile);
});

function processStoryboardFile(storyboardFile) {

    var storyboardString = mod_fs.readFileSync(storyboardFile);
    
    if (storyboardString !== undefined && storyboardString.length > 0) {

        mod_xml2js.parseString(storyboardString, (err, xibInstance) => {

            if (xibInstance.document === undefined || xibInstance.document.scenes === undefined) {
                return;
            }

            xibInstance.document.scenes.forEach((scene, sceneIndex) => {

                var objcs = scene.scene[0].objects[0];
                var objKeys = Object.keys(objcs);
    
                objKeys.forEach((xibKey, xibKeyIndex) => {
    
                    var viewInstance = mod_nibs.viewInstance(xibKey, objcs[xibKey][0], storyboardFile);
    
                    if (viewInstance !== undefined) {
    
                        printNavigationBars(viewInstance);
                    }
                });
            });
        });
    }
}

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


                }
            });
        });
    }
}

function printNavigationBars(viewController) {

    var views = viewController.views;

    if (views !== undefined) {

        views.forEach((view, viewIndex) => {

            if (view instanceof mod_nibs.UINavigationBar) {

                console.log(viewController);
            }
        });
    }
}