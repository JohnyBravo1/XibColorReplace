var mod_dir = require('./../dir');
var mod_fs = require('fs');
var mod_plist = require('plist');

var dir = new mod_dir.Directory("$DOCUMENTS/SS/Theming/Extracts");
var extracts = dir.filesWithExtension("plist", true);

var colorsByKeys = new Object();

extracts.forEach((extractFile, extractFileIndex) => {

    var extractFileContent = mod_fs.readFileSync(extractFile, 'utf8');
    var plistInstance = mod_plist.parse(extractFileContent);

    if (plistInstance !== undefined) {

        processPlist(plistInstance);
    }
});

function processPlist(plistInstance) {

    if (plistInstance.colors !== undefined) {

        var plistColorKeys = Object.keys(plistInstance.colors);

        plistColorKeys.forEach((plistColorKey, plistColorKeyIndex) => {

            var plistColorValue = plistInstance.colors[plistColorKey].hexColor;
            var length = (colorsByKeys[plistColorKey] !== undefined ? colorsByKeys[plistColorKey].length : 0);

            if (colorsByKeys[plistColorKey] === undefined) colorsByKeys[plistColorKey] = new Array();
            if (colorsByKeys[plistColorKey].indexOf(plistColorValue) === -1) colorsByKeys[plistColorKey][length] = plistColorValue;
        });
    }
    if (plistInstance.subviews !== undefined) {

        plistInstance.subviews.forEach((sv, svIndex) => {

            processPlist(sv);
        });
    }
}

function sortArray(arr) {

    for (var a = 0; a < arr.length -1; a++) {

        for (var b = a + 1; b < arr.length; b++) {

            if (arr[a] > arr[b]) {

                var holder = arr[a];
                arr[a] = arr[b];
                arr[b] = holder;
            }
        }
    }

    return (arr);
}

var keys = Object.keys(colorsByKeys);
keys.forEach((key, keyIndex) => {

    colorsByKeys[key] = sortArray(colorsByKeys[key]);
});
console.log(colorsByKeys);