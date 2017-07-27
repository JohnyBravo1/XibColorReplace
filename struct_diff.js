function merge(another) {

    var result = new Array();

    if (another instanceof Array) {

        another.forEach((a, aIndex) => {

            if (result.indexOf(a) === -1) {

                result[result.length] = a;
            }
        });
        this.forEach((a, aIndex) => {

            if (result.indexOf(a) === -1) {

                result[result.length] = a;
            }
        });
    }
    else if (another !== undefined || another instanceof Object || another instanceof Number) {

        result[result.length] = another;
    }

    return (result);
}

Array.prototype.merge = merge;

class DiffInfo {

    constructor(key, aVal, bVal) {

        this.key = key;
        this.aVal = aVal;
        this.bVal = bVal;
    }
}

class Diff {

    constructor(a, b, parentKey) {

        var aKeys = (a === undefined ? new Array() : Object.keys(a));
        var bKeys = (b === undefined ? new Array() : Object.keys(b));

        var allKeys = aKeys.merge(bKeys);
        this.diff = undefined;

        allKeys.forEach((key, keyIndex) => {

            var newParentKey = (parentKey === undefined ? key : parentKey + "." + key);
            if (a === undefined || b === undefined) {

                this.diff = (this.diff !== undefined ? this.diff : new Array());
                this.diff[this.diff.length] = new DiffInfo(newParentKey, a, b);
            }
            else if (a[key] instanceof Object && b[key] instanceof Object) {

                var childDiff = new Diff(a[key], b[key], key);

                if (childDiff.diff !== undefined) {

                    this.diff = (this.diff !== undefined ? this.diff : new Array());
                    this.diff[this.diff.length] = childDiff;
                }
            }
            else if (a[key] != b[key]) {

                this.diff = (this.diff !== undefined ? this.diff : new Array());

                this.diff[this.diff.length] = new DiffInfo(newParentKey, a[key], b[key]);
            }
        });
    }

    debug() {

        for (var k = 0; k < this.diff.length; k++) {

            console.log(this.diff[k]);
        }
    }
}

module.exports = {

    Diff: Diff
}