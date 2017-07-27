var mod_args = require('./args');
var mod_dir = require('./../dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_plist = require('plist');
var mod_xml2js = require('xml2js');

var templatePath = mod_args.args.fileArgument(undefined, ".template");

/**
 * BRIEF DEBRIEF,
 * 
 * templator inserts userDefinedRuntimeAttributes mapped by a Theme-Convert plist placed in the Templates folder of the
 * SS directory that is used to specify if a color maps to Primary, Secondary, Tertiary or Additional...
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
    //this.addReplacement(replacementKey, colorValue, colorExclude, colorReplace, state, stateTitle, viewType);
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

        this.replacement.forEach((r, rIndex) => {

            var colorExclude = (r.colorExclude !== undefined ? r.colorExclude : undefined);

            if (r.colorValue !== undefined && r.colorValue instanceof Array) {

                r.colorValue.forEach((colorValue, colorValueIndex) => {

                    viewInstance.replace(r.colorKey, colorValue, colorExclude, r.replaceColorValue, r.state, r.stateTitle, r.viewType);
                });
            }
            else viewInstance.replace(r.colorKey, r.colorValue, colorExclude, r.replaceColorValue, r.state, r.stateTitle, r.viewType);
        });
        viewInstance.commit(xibInstance, this.outputPath);
    }

    applyTheme(xibInstance, viewInstance) {

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
            });
        }
    }
}

class ThemeMap {

    static map(colorKey, colorHex) {

        var mappedStyle = "secondary";

        if (colorKey === undefined || colorHex === undefined) {

            console.log("colorKey or colorHex for mapping theme key not specified");
            return (mappedStyle);
        }
        if (colorHex.length == 7) {

            colorHex = colorHex.substring(1, colorHex.length);
        }
        if (ThemeMap.themeMap === undefined) {

            ThemeMap.themeMap = ThemeMap.readTheme();
        }
        colorHex = colorHex.toUpperCase();
        Object.keys(ThemeMap.themeMap).forEach((themeStyle, themeStyleIndex) => {

            if (ThemeMap.themeMap[themeStyle][colorKey] === undefined) {

                console.log("unable to map (" + colorKey.toUpperCase() + ") - " + colorKey + " with hex (#" + colorHex.toUpperCase() + ")" + " from Theme-Convert.plist");
                return;
            }
            if (ThemeMap.themeMap[themeStyle][colorKey].toUpperCase() == colorHex) {

                mappedStyle = themeStyle;
                return;
            }
        });

        return (mappedStyle);
    }

    static readTheme() {

        var themePath = mod_dir.FilePath.specialPath("$DOCUMENTS/SS/Theming/Theme-Convert.plist");

        if (mod_fs.existsSync(themePath)) {

            var data = mod_fs.readFileSync(themePath, 'utf-8');
            var themePlist = mod_plist.parse(data.toString());

            return (themePlist);
        }

        return (undefined);
    }
}

mod_nibs.UIView.prototype.template = function() {

    if (this.colors !== undefined) {

        Object.keys(this.colors).forEach((colorKey, colorKeyIndex) => {

            var mappedStyle = ThemeMap.map(colorKey, this.colors[colorKey].hexColor);
            this.theme(mappedStyle, colorKey);
        });
    }
    if (this.subviews !== undefined) {

        this.subviews.forEach((sv, svIndex) => {

            sv.template();
        });
    }
}

var template = new Template(templatePath);
var inputPath = template.inputPath;
var outputPath = template.outputPath;

inputPath = (inputPath === undefined ? mod_args.args.argument(1, undefined) : inputPath);
if (inputPath === undefined) {

    console.log("NO INPUT PATH SPECIFIED");
    process.exit(0);
}

var dir = new mod_dir.Directory(inputPath);
var xibs = dir.filesWithExtension(".xib", true);

if (xibs !== undefined) {

    xibs.forEach((xibFile, xibIndex) => {

        var xibContent = mod_fs.readFileSync(xibFile);
        new mod_xml2js.Parser().parseString(xibContent, (err, xibInstance) => {

            if (err != null) {

                console.log(err);
                process.exit(0);
            }
            if (xibInstance !== undefined && xibInstance.document !== undefined) {

                var xibObjects = xibInstance.document.objects[0];
                var objectKeys = Object.keys(xibObjects);

                objectKeys.forEach((objectKey, objectKeyIndex) => {

                    var viewInstance = mod_nibs.viewInstance(objectKey, xibObjects[objectKey][0], xibFile);
                    if (viewInstance !== undefined) {

                        viewInstance.template();
                        template.applyTheme(xibInstance, viewInstance);
                        console.log("themed " + viewInstance.viewType);
                    }
                });
            }
        });
    });
}