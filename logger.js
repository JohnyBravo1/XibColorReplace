var mod_chalk = require('chalk');

function error(message, header) {

    log(message, "error", header, "------------\n");
}

function info(message, header) {

    log(message, "info", header);
}

function success(message, header) {

    log(message, "success", header);
}

function warning(message, header) {

    log(message, "warning", header);
}

/**
 * console.log a message, with optional header and separator
 * 
 * @param {String} message message to console.log
 * @param {error|info|success|warning} type message type
 * @param {String} header optional header of message
 * @param {String} separator optional separator after message
 * @param {Boolean} output optional, if true, returns the formatted string, 
 * else console.log's the string. Defaults to true
 */
function log(message, type, header, separator, output) {

    const isHeaderSet = (header !== undefined);
    const isMessageSet = (message !== undefined);
    const isSeparatorSet = (separator !== undefined);
    const isTypeSet = (type !== undefined);

    if (!isHeaderSet && !isMessageSet) {

        return;
    }
    const headerReplacement = (isHeaderSet ? "[--1--]" : "");
    const messageReplacement = (isMessageSet ? "[--2--]" : "");
    const separatorReplacement = (isSeparatorSet ? "[--3--]" : "");

    var outputString = headerReplacement + messageReplacement + separatorReplacement;
    type = (isTypeSet ? type.toLowerCase() : "info");
    output = (output === undefined ? true : output);

    if (isHeaderSet) {

        outputString = outputString.replace(headerReplacement, header + "\n");
    }
    if (isMessageSet) {

        outputString = outputString.replace(messageReplacement, message);
    }
    if (isSeparatorSet) {

        outputString = outputString.replace(separatorReplacement, "\n" + separator);
    }

    switch (type) {

        case "error": {
            outputString = mod_chalk.red(outputString);
        } break;
        case "info": {
            outputString = mod_chalk.cyan(outputString);
        } break;
        case "success": {
            outputString = mod_chalk.green(outputString);
        } break;
        case "warning": {
            outputString = mod_chalk.keyword("orange")(outputString);
        } break;
    }

    if (output === true) console.log(outputString);
    else return (outputString);
}

module.exports = {

    log: log,

    error: error,
    info: info,
    success: success,
    warning: warning
}