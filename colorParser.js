var mod_fs = require('fs');
var mod_plist = require('plist');
var mod_args = require('./args');
var mod_nibs = require('./nibs');

/// SETUP FILTERS FROM COMMAND INPUT

var args = mod_args.args;

var colorsDir = undefined;
var filterColorKey = undefined;
var filterViewType = undefined;
var operation = undefined;

operation = args.argumentWithin( [ "colorKeys", "help", "viewTypes" ] );
colorsDir = args.fileArgument("./colors");
filterColorKey = args.argumentWithin( mod_nibs.colorKeys );
filterViewType = args.argumentWithin( mod_nibs.viewTypes );

if (operation == "help") {

    printUsage();
    process.exit(0);
}

if (filterColorKey == "*") filterColorKey = undefined;
if (filterViewType !== undefined && !filterViewType.startsWith("UI")) filterViewType = undefined;

function printUsage() {

    console.log("usage: ColorParser [colorsDir|colorKey|colorKeys|viewTypes] [colorKey|viewType]");
    console.log("colorsDir - process outputted plist files of NibParser within this directory");
    console.log("colorKey - return only the hex codes of the specified colorKey (ex backgroundColor)");
    console.log("colorKeys - return all color keys found within the colors directory");
    console.log(mod_nibs.colorKeys);
    console.log("viewType - returns all colors for the specified viewType");
    console.log("viewTypes - return all view types found within the colors directory");
    console.log(mod_nibs.viewTypes);
}

class ColorPlist {

    constructor(plistInstance) {

        this.parseView(plistInstance);
    }

    colors(colorKey, viewType) {

        var colors = new Array();

        if (viewType === undefined || this.viewType == viewType) {

            if (this.viewColors !== undefined) {

                if (colorKey === undefined) {

                    colors[colors.length] = this.viewColors;
                }
                else if (this.viewColors[colorKey] !== undefined) {

                    colors[colors.length] = new Object();
                    colors[colors.length-1][colorKey] = this.viewColors[colorKey].hexColor;
                }
            }
        }
        if (this.subviews != undefined) {

            var subviewIndex = 0;
            var subviewColors = undefined;

            colors[colors.length] = new Object();
            colors[colors.length-1]['subviews'] = new Array();
            this.subviews.forEach((subview, index) => {

                subviewColors = subview.colors(colorKey, viewType);
                if (subviewColors !== undefined && subviewColors.length > 0) {
                    colors[colors.length-1]['subviews'][subviewIndex++] = subviewColors;
                }
            });
        }

        return (colors);
    }

    colorKeys(viewType) {

        var allKeys = this.allColorKeys;

        if (viewType !== undefined && viewType != this.viewType) {

            allKeys = undefined;
        }
        if (this.subviews !== undefined) {

            this.subviews.forEach((subView, index) => {

                allKeys = mergeArray(allKeys, subView.colorKeys(viewType));
            });
        }

        return (allKeys);
    }

    parseSubView(subviewXML) {

        var colorInstance = new ColorPlist(subviewXML);

        if (this.subviews === undefined) this.subviews = new Array();
        this.subviews[this.subviews.length] = colorInstance;
    }

    parseView(viewXML) {

        this.className = viewXML.className;
        this.viewType = viewXML.viewType;

        this.viewColors = viewXML.colors;

        if (viewXML.colors !== undefined) {

            var keys = Object.keys(viewXML.colors);
            this.allColorKeys = mergeArray(this.allColorKeys, keys);
        }
        if (viewXML.subviews !== undefined) {

            viewXML.subviews.forEach((subviewXML, index) => {

                this.parseSubView(subviewXML);
            });
        }
    }

    viewTypes() {

        var viewTypes = [ this.viewType ];

        if (this.subviews !== undefined) {

            this.subviews.forEach((subview, index) => {

                viewTypes = mergeArray(viewTypes, subview.viewTypes());
            });
        }

        return (viewTypes);
    }
}

var files = mod_fs.readdirSync(colorsDir);
if (files !== undefined) {

    var allColorKeys = new Array();
    var allViewTypes = new Array();
    var filterColors = new Array();

    files.forEach((plistFile, index) => {

        var plistXMLString = mod_fs.readFileSync("./colors/" + plistFile).toString();
        var plistXMLInstance = mod_plist.parse(plistXMLString);
        var colorInstance = new ColorPlist(plistXMLInstance);

        allColorKeys = mergeArray(allColorKeys, colorInstance.colorKeys());
        allViewTypes = mergeArray(allViewTypes, colorInstance.viewTypes());
        filterColors = mergeArray(filterColors, colorInstance.colors(filterColorKey, filterViewType));

        if (operation === undefined) {

            if (filterColors !== undefined && filterColors.length > 0) {

                console.log(plistFile);
                console.log("======== " + (filterViewType === undefined ? "All Views" : filterViewType) + " (" + (filterColorKey === undefined ? "All color keys" : filterColorKey) + ") =========");
                console.log(filterColors);
                console.log("======== " + (filterViewType === undefined ? "All Views" : filterViewType) + " (" + (filterColorKey === undefined ? "All color keys" : filterColorKey) + ") =========");

                var filterColorString = mod_plist.build(filterColors);
                mod_fs.writeFileSync("colors.plist", filterColorString);
            }
        }
    });

    if (operation == "colorkeys") console.log(allColorKeys);
    else if (operation == "viewtypes") console.log(allViewTypes);
}

function mergeArray(a, b) {

    if (a === undefined) a = new Array();
    if (b === undefined) b = new Array();

    var c = a;

    for (var bIndex = 0; bIndex < b.length; bIndex++) {

        if (c.indexOf(b[bIndex]) === -1) {

            c[c.length] = b[bIndex];
        }
    }
    return (c);
}