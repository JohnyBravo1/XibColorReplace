var mod_args = require('./args');
var mod_diff = require('./struct_diff');
var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_plist = require('plist');
var mod_xml2js = require('xml2js');

var templateFile = mod_args.args.fileArgument(undefined, ".template");

function clone(obj) {

    var o = Object.create(Object.getPrototypeOf(obj));

    Object.getOwnPropertyNames(obj).forEach((prop, propIndex) => {

        if (obj[prop] instanceof Object) {

            var co = clone(obj[prop]);

            o[prop] = co;
        }
        else o[prop] = obj[prop];
    });

    return (o);
}

class ThemeTemplate {

    constructor(templateFile) {

        this.parseThemeTemplate(templateFile);
    }

    inputDirectory() { return (new mod_dir.Directory(this.inputPath)); }
    outputDirectory() { return (new mod_dir.Directory(this.outputPath)); }

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
        this.outputPath = mod_dir.FilePath.specialPath(this.outputPath === undefined ? "$Desktop" : this.outputPath);
    }

    parseThemeTemplate(templateFile) {

        mod_xml2js.parseString(mod_fs.readFileSync(templateFile), (err, templateInstance) => {

            if (err != null) {

                console.log("failed to parse theme template with error: " + err);
                process.exit(0);
            }
            this.parseFileMatch(templateInstance.theme.fileMatch);
            this.parsePaths(templateInstance.theme.path);
            this.parseViews(templateInstance.theme.view);
        });
    }

    parseFileMatch(fileMatches) {

        if (fileMatches === undefined) { return; }

        this.fileMatches = new Array();

        fileMatches.forEach((fileMatch, fileMatchIndex) => {

            this.fileMatches[this.fileMatches.length] = fileMatch['$'].filter;
            fileMatch['$'].filter
        });
    }

    parseViews(views) {

        if (views === undefined) { return; }

        this.views = new Array();

        views.forEach((view, viewIndex) => {

            var viewObject = new Object();

            viewObject.type = (view['$'] !== undefined ? view['$'].type : undefined);
            viewObject.keyPaths = new Array();
            view.keyPath.forEach((keyPath, keyPathIndex) => {

                var replace = this.extractReplace(keyPath['$'].replace);

                viewObject.keyPaths[viewObject.keyPaths.length] = { "keyPath": keyPath['_'], "replace": replace, "value": keyPath['$'].with };
            });
            this.views[this.views.length] = viewObject;
        });
    }

    // {-1,-1}[-1,1]<tertiary>:UIView
    extractReplace(replace) {

        var replaceInstance;

        var originCloseBracket = replace.indexOf("}");
        if (originCloseBracket !== -1) {

            var originString = replace.substring(1, originCloseBracket);
            var split = originString.split(",");
            var origin = {"x":split[0]-0, "y":split[1]-0};
            var viewType = replace.substring(originCloseBracket+2, replace.length);

            replaceInstance = {
                origin: origin,
                viewType:viewType
            };
        }

        var frameCloseBracket = replace.indexOf("]");
        if (frameCloseBracket !== -1) {

            var frameString = replace.substring(originCloseBracket+2, frameCloseBracket);
            var split = frameString.split(",");

            var frame = {"w":split[0]-0, "h":split[1]-0};
            var viewType = replace.substring(frameCloseBracket+2, replace.length);

            replaceInstance = {
                frame: frame,
                origin: (replaceInstance.origin !== undefined ? replaceInstance.origin : { x: -1, y: -1 }),
                viewType:viewType
            };
        }

        var angleCloseBracket = replace.indexOf(">");
        if (angleCloseBracket !== -1) {

            var replaceValue = replace.substring(replace.indexOf("<")+1, angleCloseBracket);
            var viewType = replace.substring(angleCloseBracket+2, replace.length);

            replaceInstance = {
                frame: (replaceInstance.frame !== undefined ? replaceInstance.frame : { w: -1, h: -1 }),
                origin: (replaceInstance.origin !== undefined ? replaceInstance.origin : { x: -1, y: -1 }),
                replace: (replaceValue),
                viewType: (viewType)
            };
        }

        if (replaceInstance !== undefined) return (replaceInstance);

        return (replace);
    }

    replace(viewInstance, xibInstance) {

        if (!this.outputDirectory().exists()) this.outputDirectory().mkdir();

        viewInstance.hasChanges = () => { return (true) };

        var temp = new Object();
        this.views.forEach((themeView, themeViewIndex) => {

            xibInstance = viewInstance.retheme(themeView, xibInstance);
        });

        return (xibInstance);
    }
}

function retheme(view, xibInstance) {

    var themeView = clone(view);

    if (themeView.type === undefined || themeView.type == "*" || themeView.type == this.viewType) {

        var xibView = this.viewFromXibInstance(xibInstance);
        var overwrite = false;

        themeView.keyPaths.forEach((view, viewIndex) => {

            if (xibView.userDefinedRuntimeAttributes === undefined) return;
            overwrite = false;

            if (view.replace instanceof Object && this.rect !== undefined) {

                var replaceFrame = view.replace.frame;
                var replaceOrigin = view.replace.origin;
                var replaceViewType = view.replace.viewType;
                var replaceTheme = view.replace.replace;

                var hCheck = (replaceFrame === undefined || replaceFrame.h-0 == -1 || this.rect.h-0 == replaceFrame.h-0);
                var xCheck = (replaceOrigin === undefined || replaceOrigin.x-0 == -1 || this.rect.x-0 == replaceOrigin.x-0);
                var yCheck = (replaceOrigin === undefined || replaceOrigin.y-0 == -1 || this.rect.y-0 == replaceOrigin.y-0);
                var wCheck = (replaceFrame === undefined || replaceFrame.w-0 == -1 || this.rect.w-0 == replaceFrame.w-0);
                var viewCheck = (this.viewType == replaceViewType);

                if (xCheck && yCheck && hCheck && wCheck && viewCheck) {

                    if (replaceTheme !== undefined) {

                        view.replace = replaceTheme;
                    }
                    else {
                        overwrite = true;
                    } 
                }
            }
            for (var k = 0; k < xibView.userDefinedRuntimeAttributes[0].userDefinedRuntimeAttribute.length; k++) {

                var attribKeyPath = xibView.userDefinedRuntimeAttributes[0].userDefinedRuntimeAttribute[k]['$'].keyPath;
                var attribValue = xibView.userDefinedRuntimeAttributes[0].userDefinedRuntimeAttribute[k]['$'].value;
                var replaceValue = view.value;

                if (view.keyPath == attribKeyPath && (view.replace == attribValue || overwrite == true)) {

                    xibView.userDefinedRuntimeAttributes[0].userDefinedRuntimeAttribute[k]['$'].value = replaceValue;
                    break;
                }
            }
        });
    }
    if (this.subviews !== undefined) {

        this.subviews.forEach((subview, subviewIndex) => {

            themeView.type = subview.viewType;
            xibInstance = subview.retheme(themeView, xibInstance);
        });
    }

    return (xibInstance);
}

mod_nibs.UIView.prototype.retheme = retheme;

var themeTemplate = new ThemeTemplate(templateFile);
var directory = themeTemplate.inputDirectory();
var xibFiles = directory.filesWithExtension(".xib");

xibFiles.forEach((xibFile, xibFileIndex) => {

    var xibString = mod_fs.readFileSync(xibFile, "UTF-8");
    mod_xml2js.parseString(xibString, (err, xibInstance) => {

        if (xibInstance.document !== undefined) {

            var objcs = xibInstance.document.objects[0];
            
            Object.keys(objcs).forEach((key, keyIndex) => {

                var viewInstance = mod_nibs.viewInstance(key, objcs[key][0], xibFile);

                if (viewInstance !== undefined) {

                    console.log(xibFile);
                    xibInstance = themeTemplate.replace(viewInstance, xibInstance);
                    viewInstance.commit(xibInstance, themeTemplate.outputPath);
                }
            });
        }
    });
});