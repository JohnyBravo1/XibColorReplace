var mod_fs = require('fs');

var args = new Array();

class Args {

    constructor(args) {

        this.args = args;
        this.argsLength = this.args.length;
    }

    argument(argumentIndex, defaultValue) {

        var arg = this.args[argumentIndex];

        return (arg === undefined ? defaultValue : arg);
    }

    argumentWithin(validValues, caseSensitive) {

        caseSensitive = (caseSensitive === undefined ? false : caseSensitive);
        var argument = undefined;

        for (var j = 0; j < this.args.length; j++) {

            for (var k = 0; k < validValues.length; k++) {

                var arg = this.args[j];
                var validValue = validValues[k];

                arg = (caseSensitive ? arg : arg.toLowerCase());
                validValue = (caseSensitive ? validValue : validValue.toLowerCase());

                if (arg == validValue) {

                    argument = arg;
                    break;
                }
            }
            if (argument !== undefined) break;
        }

        return (argument);
    }

    /**
     * returns the first file argument
     * 
     * @param defaultValue - if not found, populate the result with this default value
     * @param extension - finds the argument with the given extension
     */
    fileArgument(defaultValue, extension, exclude) {

        var fileArg = undefined;
        for (var index = 0; index < this.argsLength; index++) {
            
            fileArg = this.args[index];
            if (extension !== undefined) {

                if (extension instanceof Array) {

                    var isOneOf = false;
                    extension.forEach((ext, extIndex) => {
                        if (fileArg.indexOf(ext) !== -1) {
                            isOneOf = true;
                        }
                    });

                    if (isOneOf) break;
                }
                else if (fileArg.indexOf(extension) !== -1) {
                    break;
                }
            }
            else if (this.fileExists(fileArg)) break;

            fileArg = undefined;
        }

        return (fileArg === undefined ? defaultValue : fileArg);
    }

    fileExists(arg) {

        return (mod_fs.existsSync(arg) || mod_fs.existsSync(process.cwd + "/" + arg));
    }
}

for (var argIndex = 2; argIndex < process.argv.length; argIndex++) {

    args[argIndex - 2] = process.argv[argIndex];
}

module.exports = {

    args: new Args(args)
}