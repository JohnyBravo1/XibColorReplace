var mod_args = require('./args');
var mod_diff = require('./struct_diff');
var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_xml2js = require('xml2js');

var source = mod_args.args.argument(0);
var target = mod_args.args.argument(1);

function printUsage() {

    console.log("copies all userDefinedAttributes from source to matching view(s) in target using their rects");
    console.log("copy [source] [target]");
    process.exit(0);
}

if (source === undefined || target === undefined) {

    printUsage();
}

var sourceXML = mod_fs.readFileSync(source);
var targetXML = mod_fs.readFileSync(target);
var sourceXibInstance = undefined;
var targetXibInstance = undefined;

function rectEquals(aRect, bRect) {

    var xCheck = (aRect.x-0 == bRect.x-0);
    var yCheck = (aRect.y-0 == bRect.y-0);
    var hCheck = (aRect.h-0 == bRect.h-0);
    var wCheck = (aRect.w-0 == bRect.w-0);

    return (xCheck && yCheck && hCheck && wCheck);
}

function copyUserAttribs(targetView) {

    if (rectEquals(this.rect, targetView.rect)) {

        if (this.userDefinedRuntimeAttributes !== undefined) {

            targetView.userDefinedRuntimeAttributes = new Object();
            targetView.userDefinedRuntimeAttributes = Object.assign(targetView.userDefinedRuntimeAttributes, this.userDefinedRuntimeAttributes);
        }
    }
    if (this.subviews !== undefined) {

        this.subviews.forEach((sv, svIndex) => {

            targetView.subviews[svIndex] = sv.copyUserAttribs(targetView.subviews[svIndex]);
        });
    }

    return (targetView);
}

function populateUserAttributes(xibInstance) {

    if (this.userDefinedRuntimeAttributes !== undefined) {

        var xibView = this.viewFromXibInstance(xibInstance);

        xibView.userDefinedRuntimeAttributes = new Object();
        xibView.userDefinedRuntimeAttributes = Object.assign(xibView.userDefinedRuntimeAttributes, this.userDefinedRuntimeAttributes);
    }

    if (this.subviews !== undefined) {
        this.subviews.forEach((sv, svIndex) => {
            xibInstance = sv.populateUserAttributes(xibInstance);
        });
    }

    return (xibInstance);
}

mod_nibs.UIView.prototype.copyUserAttribs = copyUserAttribs;
mod_nibs.UIView.prototype.populateUserAttributes = populateUserAttributes;
mod_nibs.UIView.prototype.hasChanges = () => { return (true); };

mod_xml2js.parseString(sourceXML, (err, result) => {
    if (err == null) sourceXibInstance = result;
});
mod_xml2js.parseString(targetXML, (err, result) => {
    if (err == null) targetXibInstance = result;
});

if (sourceXibInstance !== undefined && targetXibInstance !== undefined) {

    var srcObjcs = sourceXibInstance.document.objects[0];
    var targetObjcs = targetXibInstance.document.objects[0];

    var srcKeys = Object.keys(srcObjcs);
    var targetKeys = Object.keys(targetObjcs);

    srcKeys.forEach((srcKey, srcKeyIndex) => {

        var sourceView = mod_nibs.viewInstance(srcKey, srcObjcs[srcKey][0], source);
        var targetView = mod_nibs.viewInstance(srcKey, targetObjcs[srcKey][0], target);
        if (sourceView !== undefined && targetView !== undefined) {

            targetView = sourceView.copyUserAttribs(targetView);
            targetView.populateUserAttributes(targetXibInstance);

            targetView.commit(targetXibInstance, "/Users/Johan/Desktop/SSTennisEventCell.xib");
        }
    });
}