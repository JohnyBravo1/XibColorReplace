var mod_dir = require('./dir');
var mod_fs = require('fs');
var mod_plist = require('plist');

class Colors {

    constructor(plistInstance) {

        this.parsePlist(plistInstance);
    }

    parsePlist(plistInstance) {

        this.primary = plistInstance.primary;
        this.secondary = plistInstance.secondary;
        this.tertiary = plistInstance.tertiary;
    }

    phpColors(themeStyle) {

        var phpColors = "$" + themeStyle + "Colors = array (";
        Object.keys(this[themeStyle]).forEach((colorKey, colorKeyIndex) => {

            phpColors += "\"" + this[themeStyle][colorKey] + "\", ";
        });
        phpColors = phpColors.substring(0, phpColors.length-2) + ");";

        return (phpColors);
    }

    phpKeys() {

        var phpKeys = "$colorKeys = array (";

        Object.keys(this.primary).forEach((colorKey, colorKeyIndex) => {

            phpKeys += "\"" + colorKey + "\", ";
        });

        phpKeys = phpKeys.substring(0, phpKeys.length-2) + ");";

        return (phpKeys);
    }
}

var directory = new mod_dir.Directory("$DOCUMENTS/SS/MASTER/SuperSport 3/Theming/");
var plistPaths = directory.filesWithExtension("plist");

plistPaths.forEach((plistPath, plistPathIndex) => {

    plistPath = plistPath.replace("//", "/");
    var plistInstance = mod_plist.parse(mod_fs.readFileSync(plistPath, 'UTF-8'));

    var colors = new Colors(plistInstance);

    var phpKeys = colors.phpKeys();
    var phpPrimaryColors = colors.phpColors("primary");
    var phpSecondaryColors = colors.phpColors("secondary");
    var phpTertiaryColors = colors.phpColors("tertiary");

    console.log(plistPath);
    console.log("------------------------------------------");
    console.log(colors.phpKeys());
    console.log(phpPrimaryColors);
    console.log(phpSecondaryColors);
    console.log(phpTertiaryColors);
});