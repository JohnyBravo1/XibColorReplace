var mod_args = require('./args');
var mod_dir = require('./../dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_xml2js = require('xml2js');
var mod_hexRGB = require('hex-rgb');

var args = mod_args.args;

/**
 * example of a xml template for replacing colors:
 * 
   <replacement>
        <backgroundColor>
            <colorReplace>#FF00FF</colorReplace>
        </backgroundColor>
        <backgroundColor>
            <colorReplace>#2E2F32</colorReplace>
            <colorValue>#0000FF</colorValue>
        </backgroundColor>
        <textColor>
            <colorReplace>#00FF00</colorReplace>
            <colorValue>#FF0000</colorValue>
        </textColor>
        <output>
            ./output/
        </output>
    </replacement>
 */
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

            this.parseTemplate(templatePath);
        }
        else {

            this.outputPath = outputPath;
            this.addReplacement(replaceColorKey, replaceColorValue, replaceColorWithValue);
        }
    }

    /**
     * adds a color replacement description
     * 
     * @param
     */
    addReplacement(replaceColorKey, replaceColorValue, replaceColorWithValue) {

        var replacementDescriptor = { colorKey: replaceColorKey, 
                                    colorValue: replaceColorValue,
                             replaceColorValue: replaceColorWithValue };

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

                console.log(err);
                return;
            }

            var replacementKeys = Object.keys(templateXMLInstance.replacement);

            replacementKeys.forEach((replacementKey, replacementKeyIndex) => {

                if (replacementKey == "output") return;
                templateXMLInstance.replacement[replacementKey].forEach((replacement, replacementIndex) => {

                    var colorValue = (replacement.colorValue !== undefined ? replacement.colorValue[0] : undefined);
                    var colorReplace = (replacement.colorReplace !== undefined ? replacement.colorReplace[0] : undefined);
                    this.addReplacement(replacementKey, colorValue, colorReplace);
                });
            });
            this.outputPath = templateXMLInstance.replacement.output[0];
        });
    }

    replace(xibInstance, viewInstance) {

        this.replacement.forEach((r, rIndex) => {

            viewInstance.replace(r.colorKey, r.colorValue, r.replaceColorValue);
            viewInstance.commit(xibInstance, this.outputPath);
        });
    }
}

var workPath = args.argument(0);
var outputPath = args.argument(1);
var replaceColorKey = args.argumentWithin(mod_nibs.colorKeys, true);
var replaceColorValue = args.argument(3);
var replaceColorWithValue = args.argument(4);
var templatePath = args.fileArgument(undefined, ".xml");

if (args.argsLength < 2 || args.argsLength == 2 && templatePath === undefined) {

    printUsage();
    process.exit(0);
}

if (replaceColorWithValue === undefined) {

    replaceColorWithValue = replaceColorValue;
    replaceColorValue = undefined;
}

function commit(xibInstance, outputPath) {

    if (!this.hasChanges()) return;
    
    if (this.replaced !== undefined) {

        this.replaced.forEach((replacement, replacementIndex) => {

            var replacementKeys = Object.keys(replacement);

            replacementKeys.forEach((replacementKey, replacementKeyIndex) => {

                if (this.colors !== undefined && this.colors[replacementKey] !== undefined) {

                    this.replaceXibColors(xibInstance, replacement);
                }
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
}

function hasChanges() {

    var hasChanges = (this.replaced !== undefined);

    if (!hasChanges && this.subviews !== undefined) {

        var subview = undefined;
        for (var subviewIndex = 0; subviewIndex < this.subviews.length; subviewIndex++) {

            subview = this.subviews[subviewIndex];
            hasChanges = subview.hasChanges();

            if (hasChanges) break;
        }
    }

    return (hasChanges);
}

function replace(colorKey, colorValue, replaceValue) {

    if (this.colors !== undefined && this.colors[colorKey] !== undefined) {

        if (colorValue === undefined || this.colors[colorKey].hexColor == colorValue) {

            this.colors[colorKey].hexColor = replaceValue;

            this.replaced = (this.replaced === undefined ? new Array() : this.replaced);
            var replacement = new Object();

            replacement[colorKey] = replaceValue;
            this.replaced[this.replaced.length] = replacement;
        }
    }
    else if (colorValue === undefined) {

        this.replaced = (this.replaced === undefined ? new Array() : this.replaced);
        var replacement = new Object();

        replacement[colorKey] = replaceValue;
        this.replaced[this.replaced.length] = replacement;
    }
    if (this.subviews !== undefined) {

        this.subviews.forEach((subview, subviewIndex) => {

            subview.replace(colorKey, colorValue, replaceValue);
        });
    }
}

function replaceXibColors(xibInstance, replacement) {

    var replacementColorKey = Object.keys(replacement)[0];
    var rgb = mod_hexRGB(replacement[replacementColorKey]);

    var r = (rgb[0] / 255);
    var g = (rgb[1] / 255);
    var b = (rgb[2] / 255);

    var xibView = this.viewFromXibInstance(xibInstance);

    if (xibView === undefined) {

        console.log("something wrong for [" + this.xmlPath + "]");
        return;
    }
    if (xibView.color !== undefined) {

        var colorKeys = Object.keys(this.colors);
        if (colorKeys.indexOf(replacementColorKey) !== -1) {

            xibView.color.forEach((xibViewColor, colorIndex) => {

                var colorKey = xibViewColor['$']['key'];
                if (colorKey == replacementColorKey) {

                    delete xibViewColor['$'].white;
                    delete xibViewColor['$'].cocoaTouchSystemColor;

                    xibViewColor['$'].colorSpace = "calibratedRGB";
                    xibViewColor['$'].alpha = 1;
                    xibViewColor['$'].blue = b;
                    xibViewColor['$'].green = g;
                    xibViewColor['$'].red = r;
                    
                    console.log("replaced " + colorKey + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementColorKey]);
                }
            });
        }
        else {

            var colorObject = new Object();

            colorObject['$'] = new Object();

            colorObject['$'].colorSpace = "calibratedRGB";
            colorObject['$'].alpha = "1";
            colorObject['$'].blue = b;
            colorObject['$'].green = g;
            colorObject['$'].red = r;

            xibView.color[0][replacementColorKey] = colorObject;
            console.log("inserted " + replacementColorKey + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementColorKey]);
        }
    }
}

function viewFromXibInstance(xibInstance) {

    var split = this.xmlPath.split(".");
    var xibView = xibInstance;

    split.forEach((pathComponent, pathIndex) => {

        if (xibView == undefined || xibView == null) {

            return;
        }
        xibView = xibView[pathComponent];
    });

    return (xibView);
}

mod_nibs.UIView.prototype.commit = commit;
mod_nibs.UIView.prototype.hasChanges = hasChanges;
mod_nibs.UIView.prototype.replace = replace;
mod_nibs.UIView.prototype.replaceXibColors = replaceXibColors;
mod_nibs.UIView.prototype.viewFromXibInstance = viewFromXibInstance;

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

var stat = mod_fs.statSync(workPath);
var template = undefined;

if (templatePath !== undefined) template = new Template(templatePath);
else template = new Template(undefined, replaceColorKey, replaceColorValue, replaceColorWithValue, outputPath);

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