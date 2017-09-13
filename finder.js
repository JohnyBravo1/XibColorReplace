#!/usr/local/bin/node

var mod_chalk = require('chalk');
var mod_fs = require('fs');
var mod_xml2js = require('xml2js');

var mod_args = require('./args');
var mod_dir = require('./dir');
var mod_nibs = require('./nibs');
var mod_util = require('./utils');

function findThemeKey(key, keyValue, appendInfo) {

    var result = new Array();

    if (this.userDefinedRuntimeAttributes !== undefined) {

        var attribs = this.userDefinedRuntimeAttributes.userDefinedRuntimeAttribute;

        attribs.forEach((attrib, attribIndex) => {

            var attribProps = attrib['$'];

            if (attribProps.keyPath.toLowerCase() == key.toLowerCase()) {

                if (keyValue !== undefined) {

                    if (attribProps.value.toLowerCase() != keyValue.toLowerCase()) {

                        return;
                    }
                }
                var resultInstance = {
                    themeKey: attribProps.keyPath,
                    themeValue: attribProps.value,
                    xmlPath: this.xmlPath,
                };

                if (appendInfo !== undefined) {

                    resultInstance = Object.assign(resultInstance, appendInfo);
                }
                result[result.length] = resultInstance;
            }
        });
    }

    if (this.subviews !== undefined) {

        this.subviews.forEach((sv, svIndex) => {

            var subResult = sv.findThemeKey(key, keyValue, appendInfo);
            result = mod_util.merge(result, subResult);
        });
    }

    return (result);
}

function parseNib(xibFile) {

    var xibContent = mod_fs.readFileSync(xibFile);
    mod_xml2js.parseString(xibContent, (err, xibInstance) => {

        if (xibInstance.document === undefined || xibInstance.document.objects === undefined) return;

        var objcs = xibInstance.document.objects[0];
        var objKeys = Object.keys(xibInstance.document.objects[0]);

        objKeys.forEach((objKey, objKeyIndex) => {

            var viewInstance = mod_nibs.viewInstance(objKey, objcs[objKey][0], xibFile);

            if (viewInstance !== undefined) {

                var themeKeys = viewInstance.findThemeKey(searchFor, colorValue, { file: xibFile });

                if (themeKeys !== undefined && themeKeys.length > 0) {

                    console.log(themeKeys);
                }
            }
        });
    });
}

function printUsage() {

    var output;

    output = mod_chalk.cyan("finder [path] [searchFor themeColorKey|viewType] {colorValue|themeKey}\n");
    output += mod_chalk.green("path - ") + mod_chalk.red("Directory to traverse or single nib file to parse\n");
    output += mod_chalk.green("searchFor\n")
    output += mod_chalk.cyan("\tthemeColorKey - ") + mod_chalk.red("key contained within userDefinedRuntimeAttributes\n");
    output += mod_chalk.cyan("\tviewType - ") + mod_chalk.red("printout all views matching key\n");
    output += mod_chalk.green("colorValue - ") + mod_chalk.red("print colors matching this color hex string\n");
    output += mod_chalk.green("themeKey - ") + mod_chalk.red("print userDefinedRuntimeAttributes keys matching this theme key");

    console.log(output);
    process.exit(0);
}

function traverseDir(dir) {

    var dir = new mod_dir.Directory(dir);

    var files = dir.filesWithExtension(".xib", true);

    files.forEach((nibFile, nibFileIndex) => {

        parseNib(nibFile);
    });
}

var withinParms = mod_util.merge(mod_nibs.colorKeys, mod_nibs.viewKeys);

var path = mod_args.args.fileArgument();
var searchFor = mod_args.args.argumentWithin(withinParms);
var colorValue = mod_args.args.argument(2);

mod_nibs.UIView.prototype.findThemeKey = findThemeKey;

if (colorValue === undefined && searchFor === undefined) {

    printUsage();
}

if (mod_dir.isDirectory(path)) {

    traverseDir(path);
} else if (mod_dir.isFile(path)) {

    parseNib(path);
} else {

    printUsage();
}