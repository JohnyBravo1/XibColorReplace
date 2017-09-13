var mod_args = require('./args');
var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_xml2js = require('xml2js');

var template = mod_args.args.fileArgument("$DOCUMENTS/SS/Theming/header_replace.template", ".template");

class Template {

    constructor(templatePath) {

        this.templatePath = templatePath;
        this.parseTemplate();
    }

    parsePaths(templateInstance) {

        this.inputPath = (templateInstance.theme.input !== undefined ? templateInstance.theme.input[0] : undefined);
        this.outputPath = (templateInstance.theme.output !== undefined ? templateInstance.theme.output[0] : undefined);
    }

    parseReplacements(templateInstance) {

        var replacement = templateInstance.theme.replacement[0];
        var replacementKeys = Object.keys(replacement);

        this.replacement = new Object();
        replacementKeys.forEach((replaceKey, replaceKeyIndex) => {

            var arr = new Array();

            replacement[replaceKey].forEach((replace, replaceIndex) => { arr[arr.length] = replace; });
            this.replacement[replaceKey] = arr;
        });
    }

    parseTemplate() {

        if (mod_dir.isFile(this.templatePath)) {

            var templateString = mod_fs.readFileSync(this.templatePath, 'UTF-8');
            mod_xml2js.parseString(templateString, (err, templateInstance) => {

                if (err != null) {

                    console.log("failed to parse template with error:");
                    console.log(err);
                    process.exit(0);
                }
                this.parsePaths(templateInstance);
                this.parseReplacements(templateInstance);
            });
        }
        else {

            console.log("Invalid template path specified: " + this.templatePath);
            process.exit(0);
        }
    }

    processXibFiles() {

        if (this.inputPath !== undefined) {

            var xibFiles = new mod_dir.Directory(this.inputPath).filesWithExtension(".xib");
            xibFiles.forEach((xibFile, xibFileIndex) => {

                var xibString = mod_fs.readFileSync(xibFile);
                mod_xml2js.parseString(xibString, (err, xibInstance) => {

                    if (xibInstance.document === undefined || xibInstance.document.objects === undefined) {

                        return;
                    }
                    var objcs = xibInstance.document.objects[0];
                    var objKeys = Object.keys(objcs);

                    objKeys.forEach((objKey, objKeyIndex) => {

                        var viewInstance = mod_nibs.viewInstance(objKey, objcs[objKey][0], xibFile);

                        if (viewInstance !== undefined) {

                            var outputFile = this.outputFile(xibFile);
                            viewInstance.replaceAll(this.replacement);
                            viewInstance.commit(xibInstance, outputFile);
                        }
                    });
                });
            });
        }
    }

    outputFile(xibFile) {

        if (xibFile === undefined) return;

        var fileName = mod_dir.FilePath.lastPathComponent(xibFile);
        if (this.outputDir === undefined) {
            this.outputDir = new mod_dir.Directory(this.outputPath);
        }

        return (this.outputDir.filePath(fileName));
    }
}

function replaceAll(replacement) {

    var replaceKeys = Object.keys(replacement);

    replaceKeys.forEach((replaceKey, replaceKeyIndex) => {

        var replaceInfo = replacement[replaceKey][0];

        if (this.userDefinedRuntimeAttributes !== undefined && this.viewType == replaceInfo.viewType[0]) {

            var hasChanges = false;
            this.userDefinedRuntimeAttributes.userDefinedRuntimeAttribute.forEach((attrib, attribIndex) => {

                if (attrib['$'].keyPath == replaceKey && attrib['$'].value == replaceInfo.attribValue) {

                    this.userDefinedRuntimeAttributes.userDefinedRuntimeAttribute[attribIndex]['$'].value = replaceInfo.attribReplace;
                    hasChanges = true;
                }
            });
            this.hasChanges = () => { return (hasChanges); };
        }
    });

    if (this.subviews !== undefined) {

        this.subviews.forEach((sv, svIndex) => {

            sv.replaceAll(replacement);
        });
    }
}

function willCommit(xibInstance) {

    var xibView = this.viewFromXibInstance(xibInstance);

    if (xibView.userDefinedRuntimeAttributes !== undefined) {

    }
}

mod_nibs.UIView.prototype.replaceAll = replaceAll;
mod_nibs.UIView.prototype.willCommit = willCommit;

var template = new Template(template);
template.processXibFiles();