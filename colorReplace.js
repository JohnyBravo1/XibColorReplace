var mod_args = require('./args');
var mod_dir = require('./../dir');
var mod_fs = require('fs');
var mod_hexRGB = require('hex-rgb');
var mod_nibs = require('./nibs');
var mod_xml2js = require('xml2js');

var args = mod_args.args;

class Template {

    /**
     * @param templatePath - path to the xml template file to use for replacing the colors
     * @param replaceColorKey - if no template specified, use this color key when replacing colors
     * @param replaceColorValue - if no template specified, use this color value when replacing colors
     * @param replaceColorWithValue - if no template specified, use this color value when replacing colors
     * @param outputPath - the outputPath where the converted interfaces should be written to
     */
    constructor(templatePath, replaceColorKey, replaceColorValue, replaceColorWithValue, outputPath) {

        if (templatePath !== undefined) {

            this.outputPath = outputPath;
            this.parseTemplate(templatePath);
        }
        else {

            this.outputPath = outputPath;
            this.addReplacement(replaceColorKey, replaceColorValue, replaceColorWithValue);
            this.createOutputIfNotExist();
        }
        console.log("OUTPUT SET TO: [ " + this.outputPath + " ]");
        console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
    }

    createOutputIfNotExist() {

        if (this.outputPath !== undefined && !mod_fs.existsSync(this.outputPath)) {
            
            mod_fs.mkdir(this.outputPath, (error) => {

                if (error != null) {

                    console.log(error);
                    process.exit(0);
                }
            });
        }
    }

    /**
     * adds a color replacement description
     * 
     * @param replaceColorKey
     * @param replaceColorExclude
     * @param replaceColorValue
     * @param state
     * @param stateTitle
     * @param viewType
     */
    addReplacement(replaceColorKey, replaceColorValue, replaceColorExclude, replaceColorWithValue, state, stateTitle, viewType) {

        var replacementDescriptor = { colorKey: replaceColorKey, 
                             replaceColorValue: replaceColorWithValue };

        if (replaceColorValue !== undefined) replacementDescriptor.colorValue = replaceColorValue;
        if (replaceColorExclude !== undefined) replacementDescriptor.colorExclude = replaceColorExclude;
        if (state !== undefined) replacementDescriptor.state = state;
        if (stateTitle !== undefined) replacementDescriptor.stateTitle = stateTitle;
        if (viewType !== undefined) replacementDescriptor.viewType = viewType;

        this.replacement = (this.replacement === undefined ? new Array() : this.replacement);
        this.replacement[this.replacement.length] = replacementDescriptor;
    }

    /**
     * @param template - the path to the template to parse
     */
    parseTemplate(template) {

        var templateXMLString = mod_fs.readFileSync(template);
        var xmlParser = new mod_xml2js.Parser();

        xmlParser.parseString(templateXMLString, (err, templateXMLInstance) => {

            if (err != null || err != undefined) {
                return;
            }
            var replacementKeys = Object.keys(templateXMLInstance.replacement);

            replacementKeys.forEach((replacementKey, replacementKeyIndex) => {

                if (replacementKey == "input") return;
                if (replacementKey == "output") return;
                templateXMLInstance.replacement[replacementKey].forEach((replacement, replacementIndex) => {

                    var colorExclude = (replacement.colorExclude !== undefined ? replacement.colorExclude : undefined);
                    var colorValue = (replacement.colorValue !== undefined ? replacement.colorValue : undefined);
                    var colorReplace = (replacement.colorReplace !== undefined ? replacement.colorReplace[0] : undefined);
                    var state = (replacement.state !== undefined ? replacement.state[0] : undefined);
                    var stateTitle = (replacement.title !== undefined ? replacement.title[0] : undefined);
                    var viewType = (replacement.viewType !== undefined ? replacement.viewType[0] : undefined);

                    this.addReplacement(replacementKey, colorValue, colorExclude, colorReplace, state, stateTitle, viewType);
                });
            });

            if (templateXMLInstance.replacement.input !== undefined) this.inputPath = mod_dir.FilePath.specialPath(templateXMLInstance.replacement.input[0]);
            if (templateXMLInstance.replacement.output !== undefined) this.outputPath = mod_dir.FilePath.specialPath(templateXMLInstance.replacement.output[0]);
            this.createOutputIfNotExist();

            if (!mod_fs.existsSync(this.inputPath)) {

                console.log("Invalid input specified in template: " + this.inputPath);
            }
        });
    }

    replace(xibInstance, viewInstance) {

        var theme = false;
        this.replacement.forEach((r, rIndex) => {

            if (r.replaceColorValue !== undefined && r.replaceColorValue.indexOf("ary") !== -1) {

                viewInstance.theme(r.replaceColorValue, r.colorKey);
                theme = true;
                return;
            }
            var colorExclude = (r.colorExclude !== undefined ? r.colorExclude : undefined);

            if (r.colorValue !== undefined && r.colorValue instanceof Array) {

                r.colorValue.forEach((colorValue, colorValueIndex) => {

                    viewInstance.replace(r.colorKey, colorValue, colorExclude, r.replaceColorValue, r.state, r.stateTitle, r.viewType);
                });
            }
            else viewInstance.replace(r.colorKey, r.colorValue, colorExclude, r.replaceColorValue, r.state, r.stateTitle, r.viewType);
        });
        if (theme) this.applyTheme(xibInstance, viewInstance, this.outputPath);
        else viewInstance.commit(xibInstance, this.outputPath);
    }

    applyTheme(xibInstance, viewInstance, outputPath) {

        var xibView = viewInstance.viewFromXibInstance(xibInstance);

        if (xibView !== undefined) {

            xibView.userDefinedRuntimeAttributes = viewInstance.userDefinedRuntimeAttributes;

            if (viewInstance.subviews !== undefined) {

                viewInstance.subviews.forEach((subview, subviewIndex) => {

                    this.applyTheme(xibInstance, subview);
                });
            }
        }

        //only write changes made from the parent view instance
        if (viewInstance.xmlPath.indexOf("subview") === -1) {
            
            var outputPathStat = mod_fs.statSync(outputPath);

            if (outputPathStat.isDirectory()) outputPath += "/" + viewInstance.xibName;

            var builder = new mod_xml2js.Builder();
            var xml = builder.buildObject(xibInstance).toString();

            mod_fs.writeFile(outputPath, xml, (err) => {

                if (err !== null) console.log(err);
                else console.log("themed " + viewInstance.xibName);
            });
        }
    }
}

var workPath = args.fileArgument(args.argument(0), [ ".xib" ]);
var outputPath = args.argument(1);
var replaceColorKey = args.argumentWithin(mod_nibs.colorKeys, true);
var replaceColorValue = args.argument(3);
var replaceColorWithValue = args.argument(4);
var templatePath = args.fileArgument(undefined, [ ".template", ".xml" ]);

if (workPath == templatePath) workPath = args.directoryArgument(args.argument(1));

if (args.argsLength < 1 || args.argsLength == 1 && templatePath === undefined) {

    printUsage();
    process.exit(0);
}

if (replaceColorWithValue === undefined) {

    replaceColorWithValue = replaceColorValue;
    replaceColorValue = undefined;
}

function commit(xibInstance, outputPath) {

    if (!this.hasChanges()) return;

    this.willCommit(xibInstance);
    
    if (this.replaced !== undefined) {

        this.replaced.forEach((replacement, replacementIndex) => {

            var replacementKeys = Object.keys(replacement);

            replacementKeys.forEach((replacementKey, replacementKeyIndex) => {
                this.replaceXibColors(xibInstance, replacement);
            });
        });
    }
    if (this.subviews !== undefined) {

        this.subviews.forEach((subview, subviewIndex) => {
            subview.commit(xibInstance, outputPath);
        });
    }
    //only write changes made from the parent view instance
    if (this.xmlPath.indexOf("subview") === -1) {
        
        var outputPathStat = mod_fs.statSync(outputPath);

        if (outputPathStat.isDirectory()) outputPath += "/" + this.xibName;

        var builder = new mod_xml2js.Builder();
        var xml = builder.buildObject(xibInstance).toString();

        mod_fs.writeFile(outputPath, xml, (err) => {

            if (err !== null) console.log(err);
        });
    }

    return (xibInstance);
}

mod_nibs.UIView.prototype.commit = commit;

function printUsage() {

    console.log("usage: ColorReplace [workingPath] [template|outputPath] [template|replaceColorKey|replaceColorValue|replaceColorWithValue]");
    console.log("replaces colorkeys if found within the xib files that match the color values to the new color values");
    console.log("workingPath - the directory / file to work with containing xib files");
    console.log("outputPath - the output directory of the replaced interfaces");
    console.log("template - a xml input file containing all color keys and colors to replace within the interface(s)");
    console.log("replaceColorKey - replace the color keys matching this key within the interfaces");
    console.log("replaceColorValue - replace all values for color key matching this value");
    console.log("replaceColorWithValue - replace all matched color values with specified value");
    console.log("template - a path to a xml template document that maps out what colors to replace within the interface files");
}

if (!mod_fs.existsSync(workPath)) {

    console.log("invalid working path specified: " + workPath);
    process.exit(0);
}

var template = undefined;

if (templatePath !== undefined) {

    if (workPath == templatePath) {
        template = new Template(templatePath);
        workPath = (template.inputPath !== undefined ? template.inputPath : workPath);
    }
    else if (templatePath !== undefined) {

        template = new Template(templatePath, undefined, undefined, undefined, outputPath);
    }
} 
else template = new Template(undefined, replaceColorKey, replaceColorValue, replaceColorWithValue, outputPath);

if (outputPath !== undefined && (outputPath.indexOf(".xml") !== -1 || outputPath.indexOf(".template") !== -1)) {

    outputPath = "./output";
}

var stat = mod_fs.statSync(workPath);

if (stat.isDirectory()) {

    var xibs = new mod_dir.Directory(workPath).filesWithExtension(".xib", true);
    xibs.forEach((xib, xibIndex) => {
        processXib(xib);
    });
}
else processXib(workPath);

function processXib(xib) {

    console.log("working with: [" + xib + "]");
    console.log("===========================");
    var xibXML = mod_fs.readFileSync(xib);

    if (xibXML !== undefined) {

        var xmlParser = new mod_xml2js.Parser();
        xmlParser.parseString(xibXML, (err, xibInstance) => {

            if ((err !== undefined && err !== null) ||
                (xibInstance === undefined || xibInstance === null)) {
                console.log("failed to parse: " + xib + " with error:" + err);
            }
            else if (xibInstance.document !== undefined) {

                var objcs = xibInstance.document.objects[0];
                var objKeys = Object.keys(objcs);

                objKeys.forEach((key, index) => {
                    var viewInstance = mod_nibs.viewInstance(key, objcs[key][0], xib);

                    if (viewInstance !== undefined) {
                        template.replace(xibInstance, viewInstance);
                    }
                });
            }
        });
    }
}