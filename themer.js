var mod_args = require('./args');
var mod_dir = require('./../dir');
var mod_fs = require('fs');
var mod_plist = require('plist');
var mod_xml2js = require('xml2js');

/**
 * MAPS COLORS USED WITHIN REPLACE TEMPLATES INTO THEME STYLE COLORS
 */

var input = mod_args.args.argument(0, "$DOCUMENTS/SS/Theming/Templates/");
var output = mod_args.args.argument(1, "$DOCUMENTS/SS/Theming/ReplacedThemes/");

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

                console.log("invalid input specified in template: " + this.inputPath);
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

    buildTemplate() {

        var templateInstance = new Object();

        templateInstance.replacement = new Object();
        templateInstance.replacement.output = "$DOCUMENTS/SS/Theming/ReplacedMajor";
        this.replacement.forEach((replacement, replacementIndex) => {

            if (templateInstance.replacement[replacement.colorKey] === undefined) {

                templateInstance.replacement[replacement.colorKey] = new Array();
            }

            var len = templateInstance.replacement[replacement.colorKey].length;
            templateInstance.replacement[replacement.colorKey][len] = new Object();

            templateInstance.replacement[replacement.colorKey][len].colorReplace = replacement.replaceColorValue;
            templateInstance.replacement[replacement.colorKey][len].colorValue = replacement.colorValue;
            templateInstance.replacement[replacement.colorKey][len].viewType = replacement.viewType;
        });

        return (templateInstance);
    }

    createTemplate() {

        var xmlBuilder = new mod_xml2js.Builder();
        var template = this.buildTemplate();
        var xmlInstance = xmlBuilder.buildObject(template);

        this.outputPath = (this.outputPath === undefined ? mod_dir.FilePath.specialPath("$DOCUMENTS/SS/Theming/Templates/major.template") : this.outputPath);
        mod_fs.writeFile(this.outputPath, xmlInstance, (err) => {

            if (err != null) {

                console.log("failed to create template with: " + err);
            }
            else {

                console.log("created a single theming template at path [" + this.outputPath + "]");
            }
        });
    }
}

class ThemeMap {

    static map(colorKey, colorHex) {

        var mappedStyle = "primary";

        if (ThemeMap.themeMap === undefined) {

            ThemeMap.themeMap = ThemeMap.readTheme();
        }

        Object.keys(ThemeMap.themeMap).forEach((themeStyle, themeStyleIndex) => {

            if (ThemeMap.themeMap[themeStyle][colorKey] == colorHex) {

                mappedStyle = themeStyle;
                return;
            }
        });

        return (mappedStyle);
    }

    static readTheme() {

        var themePath = mod_dir.FilePath.specialPath("$DOCUMENTS/SS/Theming/Theme-Dark.plist");

        if (mod_fs.existsSync(themePath)) {

            var data = mod_fs.readFileSync(themePath, 'utf-8');
            var themePlist = mod_plist.parse(data.toString());

            return (themePlist);
        }

        return (undefined);
    }
}

var themeTemplate = new Template();
var dir = new mod_dir.Directory(input);
var path = mod_dir.FilePath.specialPath("$DOCUMENTS/SS/Theming/Extracts/colors.plist");
var templates = dir.filesWithExtension("template");
var colorPlist = undefined;
var unknownColors = new Object();

mod_fs.readFile(path, (err, data) => {

    if (err != null) {

        console.log(err);
    }
    else {
        
        colorPlist = mod_plist.parse(data.toString());
        var colorPlistKeys = Object.keys(colorPlist);

        var length = 0;
        templates.forEach((templateFile, templateFileIndex) => {

            if (templateFile.indexOf("major") !== -1) return;
            console.log("working with template: " + templateFile);
            var template = new Template(templateFile);
            if (template.replacement !== undefined) {

                template.replacement.forEach((replacement, replacementIndex) => {

                    if (replacement.colorValue !== undefined) {

                        replacement.colorValue.forEach((colorValue, colorValueIndex) => {

                            if (colorPlist[replacement.colorKey].indexOf(colorValue) !== -1) {

                                var themeKey = ThemeMap.map(replacement.replaceColorValue);
                                themeTemplate.addReplacement(replacement.colorKey, replacement.colorValue, undefined, themeKey, undefined, undefined, replacement.viewType);
                            }
                        });
                    }
                });
            }
        });

        themeTemplate.createTemplate();
    }
});