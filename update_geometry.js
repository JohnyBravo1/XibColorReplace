var mod_args = require('./args');
var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require("./nibs");
var mod_xml2js = require('xml2js');
var mod_cmd = require('node-cmd');

var sourcePath = mod_args.args.argument(0, undefined);
var targetPath = mod_args.args.argument(1, undefined);
var outputPath = mod_args.args.argument(2, targetPath);

function rectEquals(aRect, bRect) {

    if (aRect === undefined || bRect === undefined) return (false);

    var xCheck = (aRect.x-0 == bRect.x-0);
    var yCheck = (aRect.y-0 == bRect.y-0);
    var hCheck = (aRect.height-0 == bRect.height-0);
    var wCheck = (aRect.width-0 == bRect.width-0);

    return (xCheck && yCheck && hCheck && wCheck);
}

function processXibs() {

    var sourceXibInstance = undefined;
    var sourceXibString = mod_fs.readFileSync(sourcePath);
    mod_xml2js.parseString(sourceXibString, (err, result) => {

        sourceXibInstance = result;
    });
    if (sourceXibString.length == 0) {

        console.log("EMPTY XIB AT: " + sourcePath);
        return;
    }

    var targetXibInstance = undefined;
    var targetXibString = mod_fs.readFileSync(targetPath);
    mod_xml2js.parseString(targetXibString, (err, result) => {

        targetXibInstance = result;
    });
    if (targetXibString.length == 0) {

        console.log("EMPTY XIB AT: " + targetPath);
        return;
    }

    if (sourceXibInstance !== undefined && targetXibInstance !== undefined && sourceXibInstance.document !== undefined && targetXibInstance.document !== undefined) {

        update(sourceXibInstance, targetXibInstance);
    }
}

function update(source, target) {

    var srcObjcs = source.document.objects[0];
    var targetObjcs = target.document.objects[0];

    var srcKeys = Object.keys(srcObjcs);
    var targetKeys = Object.keys(targetObjcs);

    console.log(sourcePath + " => " + targetPath);

    srcKeys.forEach((key, keyIndex) => {

        var srcView = mod_nibs.viewInstance(key, srcObjcs[key][0], sourcePath);
        var targetView = mod_nibs.viewInstance(key, targetObjcs[key][0], targetPath);

        if (targetView !== undefined) {

            target = targetView.updateGeometry(srcView, target);
            targetView.commit(target, outputPath);
        }
    });
}

function updateGeometry(fromView, xibInstance) {

    if (this.rect !== undefined && fromView.rect !== undefined) {

        if (!rectEquals(this.rect, fromView.rect)) {

            console.log("UPDATE: " + this.xmlPath);
            console.log(this.rect);
            console.log(fromView.rect);
            this.rect.height = fromView.rect.height;
            this.rect.x = fromView.rect.x;
            this.rect.y = fromView.rect.y;
            this.rect.width = fromView.rect.width;
        }
    }
    if (this.subviews !== undefined) {
        this.subviews.forEach((sv, svIndex) => {
            xibInstance = sv.updateGeometry(fromView.subviews[svIndex], xibInstance);
        });
    }

    return (xibInstance);
}

mod_nibs.UIView.prototype.hasChanges = () => { return (true); }
mod_nibs.UIView.prototype.updateGeometry = updateGeometry;

if (mod_dir.isDirectory(sourcePath)) {

    var sourceDir = new mod_dir.Directory(sourcePath);
    var targetDir = new mod_dir.Directory(targetPath);
    var sourceXibs = sourceDir.filesWithExtension(".xib");

    sourceXibs.forEach((sourceXibFilePath, xibFileIndex) => {

        var fileName = mod_dir.FilePath.lastPathComponent(sourceXibFilePath);
        var targetXibFilePath = targetDir.filePath(fileName);

        sourcePath = sourceXibFilePath;
        targetPath = targetXibFilePath;
        outputPath = targetDir.filePath(mod_dir.FilePath.lastPathComponent(sourceXibFilePath));

        processXibs();
    });
}
else if (mod_dir.isFile(sourcePath)) {

    if (mod_dir.isDirectory(targetPath)) {

        var xibFile = mod_dir.FilePath.lastPathComponent(sourcePath);
        targetPath = new mod_dir.Directory(targetPath).filePath(xibFile);
    }
    processXibs();
}

console.log("-=-=-=-=-=-=-=-=");
console.log("if constraints are not updated properly, first run enable_constraints.sh".toUpperCase());
console.log("please run update_constraints.sh to fix interface builder layout issues.".toUpperCase());