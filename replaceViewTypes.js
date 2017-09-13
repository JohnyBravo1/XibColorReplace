var mod_args = require('./args');
var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
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

        if (this.outputPath === undefined) {

            process.exit(0);
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

            var root = templateXMLInstance.root;
            if (root.replacement !== undefined) {

                var attribs = new Object();
                this.replacement = new Array();
                var index = this.replacement.length;

                root.replacement.forEach((replacement, replacementIndex) => {

                    this.replacement[index] = {

                        "from": root.replacement[0].from,
                        "to": root.replacement[0].to,
                    };
                    if (root.replacement[0].identifier !== undefined) this.replacement['identifier'] = root.replacement[0].identifier;

                    var attribKeys = Object.keys(root.replacement[0].attribs[0]);
                    attribKeys.forEach((key, keyIndex) => {

                        attribs[key] = root.replacement[0].attribs[0][key][0];
                    });
                    this.replacement[index]['userDefinedAttributes'] = attribs;
                    index++;
                });
            }

            if (root.input !== undefined) this.inputPath = mod_dir.FilePath.specialPath(root.input[0]);
            if (root.output !== undefined) this.outputPath = mod_dir.FilePath.specialPath(root.output[0]);
            this.createOutputIfNotExist();

            if (!mod_fs.existsSync(this.inputPath)) {

                console.log("Invalid input specified in template: " + this.inputPath);
            }
        });
    }

    processFiles() {

        var xibFiles = this.inputFiles();

        xibFiles.forEach((xibFile, xibIndex) => {

            var xibString = mod_fs.readFileSync(xibFile);
            mod_xml2js.parseString(xibString, (err, xibInstance) => {

                var objcs = xibInstance.document.objects[0];
                var objKeys = Object.keys(objcs);

                objKeys.forEach((xibKey, xibKeyIndex) => {

                    var xibView = mod_nibs.viewInstance(xibKey, objcs[xibKey][0], xibFile);

                    if (xibView !== undefined) {

                        this.replaceView(xibView);
                    }
                });
            });
        });
    }

    replaceView(xibView) {

        this.replacement.forEach((replacement, replacementIndex) => {

            xibView.replaceViewTypes(replacement.from, replacement.to, replacement.identifier);
        });
    }

    inputFiles() {

        var dir = new mod_dir.Directory(this.inputPath);

        return (dir.filesWithExtension(".xib", true));
    }
}

function replaceViewTypes(from, to, identifier) {

    if (this.viewType == from) {

        this.convert = to;
    }
    if (this.subviews !== undefined) {
        this.subviews.forEach((sv, svIndex) => {
            sv.replaceViewTypes(from, to, identifier);
        });
    }
}

mod_nibs.UIView.prototype.replaceViewTypes = replaceViewTypes;

var templateFile = mod_args.args.fileArgument(undefined, ".template");
var template = new Template(templateFile);

template.processFiles();