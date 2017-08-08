var mod_args = require('./args');
var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_xml2js = require('xml2js');

var frameTemplate = mod_args.args.fileArgument(undefined, ".frameTemplate");

function mergeArrays(a, b) {

    var c = new Array();

    a.forEach((ea, eaIndex) => {
        
        c[c.length] = ea;
    });

    b.forEach((eb, ebIndex) => {

        c[c.length] = eb;
    });

    return (c);
}

function printUsage() {

    console.log("usage: printFrames [template]");
    console.log("template - a template specifying an input path and the frame(s) to print out");

    process.exit(0);
}

function rectEquals(aRect, bRect) {

    if (aRect === undefined || bRect === undefined) return (false);

    var xCheck = (aRect.x === undefined || bRect.x === undefined || aRect.x-0 == bRect.x-0);
    var yCheck = (aRect.y === undefined || bRect.y === undefined || aRect.y-0 == bRect.y-0);
    var hCheck = (aRect.height === undefined || bRect.height === undefined || aRect.height-0 == bRect.height-0);
    var wCheck = (aRect.width === undefined || bRect.width === undefined || aRect.width-0 == bRect.width-0);

    return (xCheck && yCheck && hCheck && wCheck);
}

function rectMatches(rect, viewType) {

    var matches = new Array();
    var matchLength = 0;

    if (this.rect !== undefined && this.viewType != viewType) {

        if (rectEquals(this.rect, rect)) {

            var matchObject =  { "frame": this.rect,
                                  "path": this.xmlPath,
                                  "type": this.viewType };

            matches[matchLength++] = matchObject;
        }
    }
    if (this.subviews !== undefined) {
        this.subviews.forEach((sv, svIndex) => {

            var subviewMatches = sv.rectMatches(rect, viewType);
            matches = mergeArrays(matches, subviewMatches);
        });
    }

    return (matches);
}

mod_nibs.UIView.prototype.rectMatches = rectMatches;

class FrameParseTemplate {

    constructor(templatePath) {

        this.parseFrameTemplate(templatePath);
    }

    processXibs() {

        var dir = new mod_dir.Directory(this.inputPath);
        var xibs = dir.filesWithExtension(".xib", true);

        xibs.forEach((xibFile, xibFileIndex) => {

            var xibString = mod_fs.readFileSync(xibFile);
            mod_xml2js.parseString(xibString, (err, xibInstance) => {

                if (err == null) {

                    if (xibInstance.document !== undefined && xibInstance.document.objects !== undefined) {

                        var objcs = xibInstance.document.objects[0];
                        var objKeys = Object.keys(objcs);

                        objKeys.forEach((objKey, objKeyIndex) => {

                            var viewInstance = mod_nibs.viewInstance(objKey, objcs[objKey][0], xibFile);

                            if (viewInstance !== undefined) {

                                this.processView(viewInstance, xibFile);
                            }
                        });
                    }
                }
            });
        });
    }

    parseFrameTemplate(templatePath) {

        mod_xml2js.parseString(mod_fs.readFileSync(templatePath), (err, templateInstance) => {

            if (err != null) {

                console.log("failed to parse theme template with error: " + err);
                process.exit(0);
            }
            this.parsePaths(templateInstance.print.path);
            this.parseViewPrints(templateInstance.print.view);
        });
    }

    parsePaths(paths) {

        if (paths !== undefined) {

            paths.forEach((path, pathIndex) => {

                var pathType = Object.keys(path['$'])[0];

                switch(pathType.toLowerCase()) {

                    case "input": { this.inputPath = path['$'][pathType]; } break;
                    case "output": { this.outputPath = path['$'][pathType]; } break;
                }
            });
        }

        this.inputPath = mod_dir.FilePath.specialPath(this.inputPath === undefined ? "$DOCUMENTS/SS/XibFiles" : this.inputPath);
        this.outputPath = mod_dir.FilePath.specialPath(this.outputPath === undefined ? "$DESKTOP" : this.outputPath);
    }

    parseViewPrints(views) {

        if (views !== undefined) {

            this.match = new Object();
            views.forEach((view, viewIndex) => {

                var viewType = view['$'].type;
                if (this.match[viewType] === undefined) {

                    this.match[viewType] = new Array();
                    var len = this.match[viewType].length;

                    view.rect.forEach((rect, rectIndex) => {

                        var rectObject = new Object();

                        if (rect['$'].x !== undefined) rectObject.x = rect['$'].x;
                        if (rect['$'].y !== undefined) rectObject.y = rect['$'].y;
                        if (rect['$'].height !== undefined) rectObject.height = rect['$'].height;
                        if (rect['$'].width !== undefined) rectObject.width = rect['$'].width;

                        this.match[viewType][len] = rectObject;
                        len++;
                    });
                }
            });
        }
    }

    processView(view, xibFile) {

        var viewTypes = Object.keys(this.match);

        viewTypes.forEach((viewType, viewTypeIndex) => {

            this.match[viewType].forEach((rect, rectIndex) => {

                var matches = view.rectMatches(rect, viewType);

                if (matches.length > 0) {

                    console.log(xibFile);
                    console.log(matches);
                }
            });
        });
    }
}

var frameTemplate = mod_args.args.fileArgument(undefined, ".template");

if (frameTemplate === undefined) {

    printUsage();
}

var frameTemplateInstance = new FrameParseTemplate(frameTemplate);
frameTemplateInstance.processXibs();