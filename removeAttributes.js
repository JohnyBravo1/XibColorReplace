var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_nibs = require('./nibs');
var mod_xml2js = require('xml2js');

var dir = new mod_dir.Directory("/Users/Johan/Documents/SS/Master");
var xibFiles = dir.filesWithExtension(".xib", true);

function removeImageBackgroundAttributes() {

    if (this.viewType == "UIImageView") {

        if (this.userDefinedRuntimeAttributes !== undefined) {

            this.userDefinedRuntimeAttributes.userDefinedRuntimeAttribute.forEach((attrib, attribIndex) => {

                if (attrib['$'].keyPath == "backgroundColor") {

                    this.hasChanges = () => { return (true); }
                    delete this.userDefinedRuntimeAttributes.userDefinedRuntimeAttribute[attribIndex];
                }
            });
        }
    }
    if (this.subviews !== undefined) {

        this.subviews.forEach((sv, svIndex) => {
            sv.removeImageBackgroundAttributes();
        });
    }
}

function willCommit(xibInstance) {

    var xibView = this.viewFromXibInstance(xibInstance);

    if (xibView !== undefined) {

        if (xibView.userDefinedRuntimeAttributes !== undefined) {

        }
    }
    if (this.subviews !== undefined) {

        this.subviews.forEach((sv, svIndex) => {
            sv.willCommit(xibInstance);
        });
    }
}

mod_nibs.UIView.prototype.removeImageBackgroundAttributes = removeImageBackgroundAttributes;
mod_nibs.UIView.prototype.willCommit = willCommit;

xibFiles.forEach((xibFile, xibFileIndex) => {

    var xibString = mod_fs.readFileSync(xibFile);
    mod_xml2js.parseString(xibString, (err, xibInstance) => {

        if (xibInstance.document === undefined) {

            return;
        }
        var objcs = xibInstance.document.objects[0];
        var objKeys = Object.keys(objcs);

        objKeys.forEach((objKey, objKeyIndex) => {

            var viewInstance = mod_nibs.viewInstance(objKey, objcs[objKey][0], xibFile);

            if (viewInstance !== undefined) {

                viewInstance.removeImageBackgroundAttributes();
                viewInstance.commit(xibInstance, xibFile);
            }
        });
    });
});