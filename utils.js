/**
 * converts a digit into hex string
 * 
 * @param d - Digit to convert to hex string
 * @param stringLength - Minimum required output hex string length
 */
function toHex(d, stringLength) {

    var r = d % 16;
    var result;

    if (d - r == 0) result = toChar(r);
    else result = toHex((d - r) / 16, undefined) + toChar(r);

    if (stringLength !== undefined) {

        stringLength = stringLength - 0;
        if (result.length < stringLength) {

            stringLength -= result.length;
            var placeholder = "";
            while (stringLength-- > 0) {

                placeholder += "0";
            }
            result = placeholder + result;
        }
    }

    return (result);
}

function toChar(n) {

    const alpha = "0123456789ABCDEF";

    return (alpha.charAt(n));
}

module.exports = {

    toHex: toHex
}