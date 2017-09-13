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


function toDec(hex) {

    hex = hex.replace("#", "").toUpperCase();
    var charIndex = hex.length;
    var charVal;
    var n = 0;
    var shift = 0;
    while (charIndex-- > 0) {

        charVal = fromChar(hex.substring(charIndex, charIndex + 1));
        n += charVal << shift;
        shift += 4;
    }

    return (n);
}

function fromChar(c) {

    const alpha = "0123456789ABCDEF";

    return (alpha.indexOf(c));
}

function toChar(n) {

    const alpha = "0123456789ABCDEF";

    return (alpha.charAt(n));
}

// TODO: multi dimensions.
function merge(a, b) {

    var c = new Array();
    c = Object.assign(c, a);

    for (var k = 0; k < b.length; k++) c[c.length] = b[k];

    return (c);
}

module.exports = {

    toDec: toDec,
    toHex: toHex,
    merge: merge
}