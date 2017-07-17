var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_plist = require('plist');
var mod_xml2js = require('xml2js');

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

            var skip = false;

            if (replacement.colorKey === undefined) {

                return;
            }

            if (templateInstance.replacement[replacement.colorKey] === undefined) {

                templateInstance.replacement[replacement.colorKey] = new Array();
            }
            else {

                templateInstance.replacement[replacement.colorKey].forEach((checkReplace, checkReplaceIndex) => {

                    if (checkReplace.colorReplace == replacement.replaceColorValue && checkReplace.viewType == replacement.viewType) {

                        if (checkReplace.colorValue + "" == replacement.colorValue + "") {

                            skip = true;
                            return;
                        }
                    }
                });
            }

            if (skip) {
                return;
            }

            var len = templateInstance.replacement[replacement.colorKey].length;
            templateInstance.replacement[replacement.colorKey][len] = new Object();

            templateInstance.replacement[replacement.colorKey][len].colorReplace = replacement.replaceColorValue;
            if (replacement.colorValue !== undefined) templateInstance.replacement[replacement.colorKey][len].colorValue = replacement.colorValue;
            templateInstance.replacement[replacement.colorKey][len].viewType = replacement.viewType;
        });

        return (templateInstance);
    }

    createTemplate(creationPath) {

        var xmlBuilder = new mod_xml2js.Builder();
        var template = this.buildTemplate();
        var xmlInstance = xmlBuilder.buildObject(template);

        creationPath = (creationPath === undefined ? "$DOCUMENTS/SS/Theming/Templates/major.template" : creationPath);
        mod_fs.writeFile(this.outputPath, xmlInstance, (err) => {

            if (err != null) {

                console.log("failed to create template with: " + err);
            }
            else {

                console.log("created a single theming template at path [" + creationPath + "]");
            }
        });
    }
}

class Colors {

    constructor(plistInstance) {

        this.parsePlist(plistInstance);
    }

    allColors(colorKey) {

        var colors = undefined;

        if (colorKey === undefined) {

        }
        else if (this.colors[colorKey] !== undefined) {

            colors = (colors !== undefined ? colors : new Object());
            colors[colorKey] = new Object();
            Object.assign(colors[colorKey], this.colors[colorKey]);
        }
        if (this.subviews !== undefined) {

            this.subviews.forEach((subview, subviewIndex) => {

                var childColors = subview.allColors(colorKey);

                if (childColors) {
                }
            });
        }

        return (colors);
    }

    parsePlist(plistInstance) {

        if (plistInstance.subviews !== undefined) {

            this.subviews = new Array();
            plistInstance.subviews.forEach((subview, subviewIndex) => {

                this.subviews[this.subviews.length] = new Colors(subview);
            });
        }
        if (plistInstance.colors !== undefined) {

            this.colors = new Object();
            Object.assign(this.colors, plistInstance.colors);

            this.className = plistInstance.className;
            this.viewType = plistInstance.viewType;
        }
    }
}

var colorsPath = mod_dir.FilePath.specialPath("$DOCUMENTS/SS/Theming/Extracts");

var majorTemplatePath = mod_dir.FilePath.specialPath("$DOCUMENTS/SS/Theming/Templates/major.template");
var template = new Template(majorTemplatePath);

var colorsDir = new mod_dir.Directory(colorsPath);

var plistFiles = colorsDir.filesWithExtension(".plist", true);

plistFiles.forEach((plistFile, plistFileIndex) => {

    if (plistFile.indexOf(".xib") == -1) {
        return;
    }

    var plistInstance = mod_plist.parse(mod_fs.readFileSync(plistFile, 'utf8'));

    var colorsInstance = new Colors(plistInstance);

    var allColors = colorsInstance.allColors("backgroundColor");
    console.log(allColors);
    process.exit(0);
});