var mod_dir = require('./../dir');
var mod_fs = require('fs');
var mod_hexRGB = require('hex-rgb');
var mod_plist = require('plist');
var mod_xml2js = require('xml2js');
var mod_utils = require('./utils.js');

var mod_colorKeys = [ 'backgroundColor', 'barTintColor', 'sectionIndexBackgroundColor', 'sectionIndexColor', 'sectionIndexBackgroundColor', 
                    'sectionIndexTrackingBackgroundColor', 'separatorColor', 'shadowColor', 'textColor', 'titleColor', 'titleShadowColor', 
                    'tintColor' ];
var mod_viewKeys = [ 'activityIndicatorView', 'barButtonItem', 'button', 'collectionView', 'collectionViewCell', 'collectionReusableView', 
                    'datePicker', 'imageView', 'label', 'navigationBar', 'navigationItem', 'pickerView', 'scrollView', 'searchBar', 
                    'segmentedControl', 'stepper', 'switch', 'tabBar', 'tabBarItem', 'tableView', 'tableViewCell', 'textField', 'textView', 
                    'toolbar', 'view' ];
var mod_viewTypes = [ "UIActivityIndicatorView", "UIBarButtonItem", "UIButton", "UICollectionView", "UICollectionViewCell", "UIDatePicker", 
                    "UIImageView", "UILabel", "UINavigationBar", "UINavigationItem", "UIPickerView", "UIScrollView", "UISearchBar", 
                    "UISegmentedControl", "UIStepper", "UISwitch", "UITabBar", "UITabBarItem", "UITableView", "UITableViewCell", "UITextField", 
                    "UITextView", "UIToolbar", "UIView" ];

class UIView {

    /**
     * expects a xml instance passed in conforming to a nib file structure.
     * 
     * @param xibObject - XMLObject instance of a xib file
     * @param viewKey - viewKey in xml for this instance
     */
    constructor(xibObject, viewKey) {

        if (xibObject === undefined) {
            return;
        }
        this.willParseView(xibObject, viewKey);
        this.parseView(xibObject, viewKey);
        this.didParseView(xibObject, viewKey);
    }

    //[ { '$': { key: 'frame', x: '10', y: '35', width: '125', height: '21' } } ]
    parseRect(xibObject) {

        if (xibObject.rect !== undefined) {

            var rect = xibObject.rect[0]['$'];
            this.rect = {

                "key": rect.key,
                "x": rect.x,
                "y": rect.y,
                "width": rect.width,
                "height": rect.height
            };
        }
    }

    didParseView(xibObject, viewKey) {

        if (xibObject.userDefinedRuntimeAttributes !== undefined) {

            this.userDefinedRuntimeAttributes = new Object();
            this.userDefinedRuntimeAttributes = Object.assign(this.userDefinedRuntimeAttributes, xibObject.userDefinedRuntimeAttributes[0]);
        }
    }

    willParseView(xibObject, viewKey) {

        this.parseRect(xibObject);
    }

    willCommit(xibInstance) {

        // if (this.rect !== undefined) {

        //     var xibView = this.viewFromXibInstance(xibInstance);

        //     xibView.rect = new Object();
        //     xibView.rect['$'] = { x: this.rect.x,
        //                              y: this.rect.y,
        //                          width: this.rect.width,
        //                         height: this.rect.height };
        // }
        // if (this.subviews !== undefined) {

        //     this.subviews.forEach((sv, svIndex) => {
        //         sv.willCommit(xibInstance);
        //     });
        // }
    }

    findFaultyConstraints(xibInstance) {

        var xibView = this.viewFromXibInstance(xibInstance);
        var results = new Array();
        var resultsLength = results.length;

        if (this.subviews !== undefined) {

            this.subviews.forEach((sv, svIndex) => {

                results = sv.findFaultyConstraints(xibInstance);
                resultsLength = results.length;
            });
        }
        if (xibView.constraints !== undefined) {

            xibView.constraints[0].constraint.forEach((constraint, constraintIndex) => {

                if (constraint.userDefinedRuntimeAttributes !== undefined) {

                    results[resultsLength++] = this.xmlPath;
                }
            });
        }

        return (results);
    }

    findUDAttribute(userAttributeKey, xibInstance) {

        var xibView = this.viewFromXibInstance(xibInstance);
        var results = new Array();
        var resultsLength = results.length;
        if (this.subviews !== undefined) {

            this.subviews.forEach((sv, svIndex) => {

                results = sv.findUDAttribute(userAttributeKey, xibInstance);
                resultsLength = results.length;
            });
        }
        if (xibView.userDefinedRuntimeAttributes !== undefined) {

            xibView.userDefinedRuntimeAttributes[0].userDefinedRuntimeAttribute.forEach((attrib, attribIndex) => {

                if (attrib['$'].keyPath.toLowerCase() == userAttributeKey.toLowerCase()) {

                    console.log(this.xmlPath);
                    results[resultsLength++] = this.xmlPath;
                }
            });
        }

        return (results);
    }

    hasChanges() {

        var hasChanges = (this.replaced !== undefined);

        if (!hasChanges && this.subviews !== undefined) {

            var subview = undefined;
            for (var subviewIndex = 0; subviewIndex < this.subviews.length; subviewIndex++) {

                subview = this.subviews[subviewIndex];
                hasChanges = subview.hasChanges();

                if (hasChanges) break;
            }
        }

        return (hasChanges);
    }

    /**
     * parses the attributes within a color tag and generates a hex code from the attributes
     * 
     * @param colorsObject - color xml tag
     */
    extractColor(colorsObject) {

        var rgba = undefined;
        if (colorsObject !== undefined) {

            rgba = {
                r: colorsObject['$']['red'],
                g: colorsObject['$']['green'],
                b: colorsObject['$']['blue'],
                a: colorsObject['$']['alpha'],
                w: colorsObject['$']['white']
            };
            rgba.r = (rgba.r === undefined ? 0 : rgba.r);
            rgba.g = (rgba.g === undefined ? 0 : rgba.g);
            rgba.b = (rgba.b === undefined ? 0 : rgba.b);
            rgba.a = (rgba.a === undefined ? 0 : rgba.a);
            rgba.w = (rgba.w === undefined ? 0 : rgba.w);
        }
        return (rgba);
    }

    /**
     * parses the subviews xml tag entries
     * 
     * @param subviews - XML Object instance of the subviews xml tag contained within this view xml tag of the nib xml
     */
    parseSubviews(subviews) {

        var subviewInstances = new Array();
        var parsed = false;
        subviews.forEach((element, elementIndex) => {
            
            var subviewInstance = undefined;
            parsed = false;
            if (element.activityIndicatorView !== undefined) {

                parsed = true;
                element.activityIndicatorView.forEach((activityIndicatorView, activityIndicatorViewIndex) => {
                    subviewInstance = new UIActivityIndicatorView(activityIndicatorView);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.barButtonItem !== undefined) {

                parsed = true;
                element.barButtonItem.forEach((barButtonItem, barButtonItemIndex) => {
                    subviewInstance = new UIBarButtonItem(barButtonItem);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.button !== undefined) {

                parsed = true;
                element.button.forEach((button, buttonIndex) => {
                    subviewInstance = new UIButton(button);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.collectionView !== undefined) {

                parsed = true;
                element.collectionView.forEach((collectionView, collectionViewIndex) => {
                    subviewInstance = new UICollectionView(collectionView);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.collectionReusableView !== undefined) {

                parsed = true;
                element.collectionReusableView.forEach((collectionviewCell, collectionViewCellIndex) => {
                    subviewInstance = new UICollectionViewCell(collectionViewCell);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.collectionViewCell !== undefined) {

                parsed = true;
                element.collectionViewCell.forEach((collectionViewCell, collectionViewCellIndex) => {
                    subviewInstance = new UICollectionViewCell(collectionViewCell);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.datePicker !== undefined) {

                parsed = true;
                element.datePicker.forEach((datePicker, datePickerIndex) => {
                    subviewInstance = new UIDatePicker(datePicker);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.imageView !== undefined) {

                parsed = true;
                element.imageView.forEach((imageView, imageViewIndex) => {
                    subviewInstance = new UIImageView(imageView);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.label !== undefined) {

                parsed = true;
                element.label.forEach((label, labelIndex) => {
                    subviewInstance = new UILabel(label);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.navigationBar !== undefined) {

                parsed = true;
                element.navigationBar.forEach((navigationBar, navigationBarIndex) => {

                    subviewInstance = new UINavigationBar(navigationBar);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.navigationItem !== undefined) {

                parsed = true;
                element.navigationItem.forEach((navigationItem, navigationItemIndex) => {
                    subviewInstance = new UINavigationItem(navigationItem);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.pickerView !== undefined) {

                parsed = true;
                element.pickerView.forEach((pickerView, pickerViewIndex) => {
                    subviewInstance = new UIPickerView(pickerView);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.scrollView !== undefined) {

                parsed = true;
                element.scrollView.forEach((scrollView, scrollViewIndex) => {
                    subviewInstance = new UIScrollView(scrollView);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.searchBar !== undefined) {

                parsed = true;
                element.searchBar.forEach((searchBar, searchBarIndex) => {
                    subviewInstance = new UISearchBar(searchBar);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.segmentedControl !== undefined) {

                parsed = true;
                element.segmentedControl.forEach((segmentedControl, segmentedControlIndex) => {
                    subviewInstance = new UISegmentedControl(segmentedControl);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.stepper !== undefined) {

                parsed = true;
                element.stepper.forEach((stepper, stepperIndex) => {
                    subviewInstance = new UIStepper(stepper);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.switch !== undefined) {

                parsed = true;
                element.switch.forEach((swtch, swtchIndex) => {
                    subviewInstance = new UISwitch(swtch);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.tabBar !== undefined) {

                parsed = true;
                element.tabBar.forEach((tabBar, tabBarIndex) => {
                    subviewInstance = new UITabBar(tabBar);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.tabBarItem !== undefined) {

                parsed = true;
                element.tabBarItem.forEach((tabBarItem, tabBarItemIndex) => {
                    subviewInstance = new UITabBarItem(tabBarItem);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.tableView !== undefined) {

                parsed = true;
                element.tableView.forEach((tableView, tableViewIndex) => {
                    subviewInstance = new UITableView(tableView);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.textField !== undefined) {

                parsed = true;
                element.textField.forEach((textField, textFieldIndex) => {
                    subviewInstance = new UITextField(textField);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.textView !== undefined) {

                parsed = true;
                element.textView.forEach((textView, textViewIndex) => {
                    subviewInstance = new UITextView(textView);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.toolbar !== undefined) {

                parsed = true;
                element.toolbar.forEach((toolbar, toolbarIndex) => {
                    subviewInstance = new UIToolbar(toolbar);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }
            if (element.view !== undefined) {

                parsed = true;
                element.view.forEach((view, viewIndex) => {
                    subviewInstance = new UIView(view);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                });
            }

            if (!parsed) console.log("===>> UNKNOWN ELEMENT FOUND IN: " + Object.keys(element));
        }, this);
        this.subviews = subviewInstances;
    }

    /**
     * parses the content contained within the XML view tag of the xib file.
     * 
     * @param xibObject - content of the view tag contained within the xib file.
     * @param viewKey - viewKey for the XML instance.
     */
    parseView(xibObject, viewKey) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIView" : xibObject['$']['customClass']);
        this.viewKey = (viewKey === undefined ? this.viewKeyString() : viewKey);
        this.viewType = "UIView";
        this.xibName = this.className + ".xib";
        this.xmlPath = "document.objects.0." + this.viewKeyString() + ".0";

        if (xibObject.color !== undefined) {

            xibObject.color.forEach((color, colorIndex) =>  {

                var colorKey = color['$']['key'];
                var rgba = this.extractColor(color);
                var normalizedRGBA = this.normalizeRGBA(rgba);
                this.makeColor(normalizedRGBA, colorKey);
                this.colors[colorKey].rgba = rgba;
            });
        }
        if (xibObject.subviews !== undefined) {

            this.parseSubviews(xibObject.subviews);
        }
    }

    /**
     * generates a hex code from the rgb values contained within the attributes of the color tag of this view for the color key
     * 
     * @param rgba - normalized json structure of the rgb values to set for the given color key.
     * @param colorKey - key of this color attribute (ex. backgroundColor, tintColor...)
     * @param hexValue - hex color code to use instead of rgba if not specified
     */
    makeColor(rgba, colorKey, hexString) {

        if (hexString !== undefined) {

            var rgb = mod_hexRGB(hexString);
            rgba = new Object();

            rgba.a = 1;
            rgba.r = rgb[0];
            rgba.g = rgb[1];
            rgba.b = rgb[2];
        }

        if (rgba.w !== undefined && rgba.w != 0) {

            var wHex = mod_utils.toHex(rgba.w, 2);
            hexString = "#" + wHex + wHex + wHex;
        }
        else {
            
            var rHex = mod_utils.toHex(rgba.r, 2);
            var gHex = mod_utils.toHex(rgba.g, 2);
            var bHex = mod_utils.toHex(rgba.b, 2);

            hexString = "#" + rHex + "" + gHex + "" + bHex
        }
        this.colors = (this.colors === undefined ? new Object() : this.colors);
        this.colors[colorKey] = new Object();
        this.colors[colorKey].rgba = rgba;
        this.colors[colorKey].hexColor = hexString;
    }

    /**
     * xcode uses values ranging between 0.0 and 1.0 for rgb values, this method converts the values
     * to range from 0 - 255 in order to generate valid hex code strings from the rgb values.
     * 
     * @param rgba - JSON structure containing the rgb values to normalize
     * 
     * @return a rgba json structure with values ranging from 0 to 255 for rgb.
     */
    normalizeRGBA(rgba) {

        var defaultColor = (rgba.w === undefined ? 0 : rgba.w * 255);

        rgba = {
 
            r: (rgba.r == undefined ? defaultColor : rgba.r * 255),
            g: (rgba.g == undefined ? defaultColor : rgba.g * 255),
            b: (rgba.b == undefined ? defaultColor : rgba.b * 255),
            w: defaultColor,
            a: (rgba.a == undefined ? 1 : rgba.a)
        }

        return (rgba);
    }

    /**
     * generates a plist file output for this UIView instance, and saves the output to the colors folder contained
     * within the working directory.
     * 
     * @param outputFile - optionally specify where the plist file will write, default generates xibName_colors.plist
     * and saves in the working directory.
     */
    outputColor(outputFile) {

        var viewContent = this.toJSON();

        var output = mod_plist.build(viewContent);
        outputFile = (outputFile == undefined ? "./colors/" + this.xibName + "_colors.plist" : outputFile);

        if (!mod_fs.existsSync("colors")) mod_fs.mkdirSync("./colors");

        var newOutputFile = outputFile;
        var newOutputIndex = 1;
        while(mod_fs.existsSync(newOutputFile)) {

            newOutputFile = "./colors/" + this.xibName + "_sibling_" + (newOutputIndex++) + "_colors.plist";
        }
        outputFile = newOutputFile;
        var callbackFunc = (err) => {

            if (err == null) console.log("successfully saved file(" + outputFile + ")...");
            else console.log("failed to save " + outputFile + "with error: " + err);
        }
        mod_fs.writeFile(outputFile, output, callbackFunc);
    }

    /**
     * constructs json of this view's subviews
     */
    subviewOutput() {

        var output = "-";

        if (this.subviews !== undefined) {

            output = new Array();
            this.subviews.forEach((subView, subViewIndex) => {

                output[output.length] = subView.toJSON()
            });
        }

        return (output);
    }

    viewKeyString() { return ("view"); }

    /**
     * constructs a json instance of this view
     */
    toJSON() {

        var viewJSON = {

            className: (this.className === undefined ? "-" : this.className),
            viewType: this.viewType
        }

        if (this.colors !== undefined) viewJSON.colors = this.colors;
        if (this.subviews !== undefined) viewJSON.subviews = this.subviewOutput();

        return (viewJSON);
    }

    replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType) {

        var canReplace = (viewType === undefined || viewType === this.viewType);
        var colorExcluded = this.excludeColor(colorKey, colorExclude);

        // replace any previous populated replacements if this replacement overrides the previous ones
        if (canReplace) {

            if (!colorExcluded) {

                var replaceLength = (this.replaced !== undefined ? this.replaced.length : 0);
                for (var replaceIndex = 0; replaceIndex < replaceLength; replaceIndex++) {
                    if (this.replaced[replaceIndex][colorKey] !== undefined && 
                        (colorValue === undefined || this.replaced[replaceIndex][colorKey].value == colorValue)) {
                        this.replaced[replaceIndex][colorKey].value = replaceValue;
                        console.log(("replaced a replacement for " + colorKey + " in " + this.viewType).toUpperCase());
                        canReplace = false;
                    }
                }
            }
            else return;

            if (this.colors !== undefined && this.colors[colorKey] !== undefined) {

                if (colorValue === undefined || this.colors[colorKey].hexColor == colorValue) {

                    this.replaced = (this.replaced === undefined ? new Array() : this.replaced);
                    var replacement = new Object();

                    replacement[colorKey] = new Object();
                    if (state !== undefined) replacement[colorKey].state = state;
                    if (stateTitle !== undefined) replacement[colorKey].stateTitle = stateTitle;
                    replacement[colorKey].value = replaceValue;

                    this.replaced[this.replaced.length] = replacement;
                }
            }
            else if (colorValue === undefined && viewType == this.viewType) {

                if (this.canInsertColorKey(colorKey)) {

                    this.replaced = (this.replaced === undefined ? new Array() : this.replaced);
                    var replacement = new Object();

                    replacement[colorKey] = new Object();
                    if (state !== undefined) replacement[colorKey].state = state;
                    if (stateTitle !== undefined) replacement[colorKey].stateTitle = stateTitle;

                    replacement[colorKey].value = replaceValue;

                    this.replaced[this.replaced.length] = replacement;
                    this.makeColor(undefined, colorKey, replaceValue);
                }
            }
        }
        if (this.subviews !== undefined) {

            this.subviews.forEach((subview, subviewIndex) => {
                subview.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);
            });
        }
    }

    excludeColor(colorKey, colorExclude) {

        var colorExcluded = false;

        if (this.replaced !== undefined && colorExclude !== undefined) {

            this.replaced.forEach((replacement, replacementIndex) => {

                if (replacement[colorKey] !== undefined) {

                    colorExclude.forEach((exclude, excludeIndex) => {

                        if (colorExcluded = replacement[colorKey].value == exclude) {

                            // delete this.replaced[replacementIndex][colorKey];

                            console.log(("excluded: " + colorKey + " [" + exclude + "] in => " + this.viewType));
                            colorExcluded = true;
                        }
                    });
                }
            });
        }

        return (colorExcluded);
    }
    
    replaceXibColors(xibInstance, replacement) {

        var replacementColorKey = Object.keys(replacement)[0];
        
        var createColor = true;
        var xibView = this.viewFromXibInstance(xibInstance);

        if (xibView === undefined) {

            console.log("something wrong for [" + this.xmlPath + "]");
            return;
        }
        var rgb = mod_hexRGB(replacement[replacementColorKey].value);

        var r = (rgb[0] / 255);
        var g = (rgb[1] / 255);
        var b = (rgb[2] / 255);
        if (xibView.color !== undefined) {

            for (var colorIndex = 0; colorIndex < xibView.color.length; colorIndex++) {

                var colorKey = xibView.color[colorIndex]['$']['key'];
                if (colorKey == replacementColorKey) {

                    delete xibView.color[colorIndex]['$'].white;
                    delete xibView.color[colorIndex]['$'].cocoaTouchSystemColor;

                    xibView.color[colorIndex]['$'].colorSpace = "calibratedRGB";
                    xibView.color[colorIndex]['$'].alpha = 1;
                    xibView.color[colorIndex]['$'].blue = b;
                    xibView.color[colorIndex]['$'].green = g;
                    xibView.color[colorIndex]['$'].red = r;

                    createColor = false;
                    
                    if (this.colors !== undefined) {

                        console.log("replaced " + colorKey + " in " + this.viewType + " from " + this.colors[colorKey].hexColor + " => " + replacement[replacementColorKey].value);

                        this.colors[colorKey].hexColor = replacement[replacementColorKey].value;
                        this.colors[colorKey].rgba.r = r;
                        this.colors[colorKey].rgba.g = g;
                        this.colors[colorKey].rgba.b = b;
                        this.colors[colorKey].rgba.a = 1;
                    }
                }
            }
            if (createColor) {

                createColor = false;
                xibView = this.removeNilColorKey(xibView, replacementColorKey);
                xibView.color[xibView.color.length] = this.colorObject(replacementColorKey, rgb);
                console.log("inserted " + replacementColorKey + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementColorKey].value);
            }
        }
        if (createColor) {

            xibView = this.removeNilColorKey(xibView, replacementColorKey);

            xibView.color = new Array();
            xibView.color[0] = this.colorObject(replacementColorKey, rgb);

            console.log("inserted " + replacementColorKey + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementColorKey].value);
        }

        return (xibInstance);
    }

    removeNilColorKey(xibView, replacementColorKey) {

        if (xibView.nil !== undefined) {
            xibView.nil.forEach((nilValue, nilIndex) => {
                if (nilValue['$'].key == replacementColorKey)
                    delete xibView.nil[nilIndex];
            });
        }

        return (xibView);
    }

    colorObject(colorKey, rgb, colorSpace) {

        var colorObject = new Object();

        var r = (rgb[0] / 255);
        var g = (rgb[1] / 255);
        var b = (rgb[2] / 255);

        colorObject['$'] = new Object();
        colorObject['$'].key = colorKey;
        colorObject['$'].colorSpace = (colorSpace === undefined ? "calibratedRGB" : colorSpace);
        colorObject['$'].alpha = "1";
        colorObject['$'].blue = b;
        colorObject['$'].green = g;
        colorObject['$'].red = r;

        return (colorObject);
    }

    viewFromXibInstance(xibInstance) {

        var split = this.xmlPath.split(".");
        var xibView = xibInstance;

        split.forEach((pathComponent, pathIndex) => {

            if (xibView == undefined || xibView == null) {
                return;
            }
            xibView = xibView[pathComponent];
        });

        return (xibView);
    }

    /**
     * @param colorKey - the color key to insert for this view replacement color
     */
    canInsertColorKey(colorKey) {

        var canInsertColor;
        var colorViewTypeCheck;

        switch(colorKey) {

            case "backgroundColor":
            case "highlighColor":
            case "tintColor": {
                colorViewTypeCheck = mod_viewTypes;
            } break;
            case "barTintColor": {
                colorViewTypeCheck = [ "UINavigationBar", "UISearchBar", "UITabBar", "UIToolbar" ];
            } break;
            case "sectionIndexBackgroundColor":
            case "sectionIndexTrackingBackgroundColor": {
                colorViewTypeCheck = [ "UITableView" ];
            } break;
            case "textColor": {
                colorViewTypeCheck = [ "UILabel", "UISearchBar", "UITextField", "UITextView" ];
            } break;
            default: colorViewTypeCheck = [ "None" ];
        }
        canInsertColor = (colorViewTypeCheck.indexOf(this.viewType) >= 0);

        return (canInsertColor);
    }

    theme(themeStyle, colorKeys) {

        var backgroundViews = [ "UICollectionView", "UICollectionViewCell", "UIImageView", "UIScrollView", "UITableView", "UITableViewCell", "UITextView", "UIView" ];
        var tintViews = [ "UIButton", "UIImageView" ];
        var colorKeys = (colorKeys === undefined ? [ "backgroundColor", "textColor", "tintColor" ] : colorKeys);
        var colorKeys = (colorKeys instanceof Array ? colorKeys : [ colorKeys ]);

        if (this.userDefinedRuntimeAttributes === undefined) {
            this.userDefinedRuntimeAttributes = new Array();
        }
        var attribs = new Object();
        var skip = false;
        attribs.userDefinedRuntimeAttribute = (this.userDefinedRuntimeAttributes.userDefinedRuntimeAttribute !== undefined ? this.userDefinedRuntimeAttributes.userDefinedRuntimeAttribute : new Array());
        colorKeys.forEach((colorKey, colorKeyIndex) => {
            
            if (!this.canInsertColorKey(colorKey, true)) return;
            if (colorKey == "backgroundColor" && backgroundViews.indexOf(this.viewType) === -1) return;

            attribs.userDefinedRuntimeAttribute.forEach((attrib, attribIndex) => {

                if (attrib['$'].keyPath == colorKey) {

                    skip = true;
                    return;
                }
            });
            if (skip) return;

            var userDefinedRuntimeAttributeInstance = new Object();
            userDefinedRuntimeAttributeInstance['$'] = new Object();

            userDefinedRuntimeAttributeInstance['$'].keyPath = colorKey;
            userDefinedRuntimeAttributeInstance['$'].type = "string";
            userDefinedRuntimeAttributeInstance['$'].value = themeStyle;
            
            attribs.userDefinedRuntimeAttribute[attribs.userDefinedRuntimeAttribute.length] = userDefinedRuntimeAttributeInstance;
        });
        if (attribs.userDefinedRuntimeAttribute.length > 0) {
            this.userDefinedRuntimeAttributes = attribs;
        }
        if (this.subviews !== undefined) {

            this.subviews.forEach((subview, subviewIndex) => {
                subview.theme(themeStyle, colorKeys);
            });
        }
    }

    commit(xibInstance, outputPath) {

        if (!this.hasChanges()) return;

        this.willCommit(xibInstance);
        
        if (this.replaced !== undefined) {

            this.replaced.forEach((replacement, replacementIndex) => {

                var replacementKeys = Object.keys(replacement);

                replacementKeys.forEach((replacementKey, replacementKeyIndex) => {
                    this.replaceXibColors(xibInstance, replacement);
                });
            });
        }
        if (this.subviews !== undefined) {

            this.subviews.forEach((subview, subviewIndex) => {
                subview.commit(xibInstance);
            });
        }
        //only write changes made from the parent view instance
        if (this.xmlPath.indexOf("subview") === -1) {
            
            var outputPathStat = mod_fs.statSync(outputPath);

            if (outputPathStat.isDirectory()) outputPath += "/" + this.xibName;

            var builder = new mod_xml2js.Builder();
            var xml = builder.buildObject(xibInstance).toString();

            mod_fs.writeFile(outputPath, xml, (err) => {

                if (err !== null) console.log(err);
            });
        }

        return (xibInstance);
    }
}

class UIActivityIndicatorView extends UIView {
    
    constructor(xibObject) {

        super(xibObject, "activityIndicatorView");

        this.parseActivityIndicatorView(xibObject);
    }

    parseActivityIndicatorView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIActivityIndicatorView" : xibObject['$']['customClass']);
        this.viewKey = "activityIndicatorView";
        this.viewType = "UIActivityIndicatorView";
    }

    viewKeyString() { return ("activityIndicatorView"); }
}

class UIBarButtonItem extends UIView {

    constructor(xibObject) {

        super(xibObject, "barButtonItem");

        this.parseBarButtonItem(xibObject);
    }

    replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType) {

        super.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);
    }

    replaceXibColors(xibInstance, replacement) {

        if (this.replaced !== undefined) {

            this.replaced.forEach((replacement, replacementIndex) => {

                var replacementKey = Object.keys(replacement)[0];
                var rgb = mod_hexRGB(replacement[replacementKey].value);
                if (xibInstance.color !== undefined && this.colors[replacementKey] !== undefined) {

                    xibInstance.color.forEach((xibInstanceColor, xibInstanceColorIndex) => {

                        var colorKey = xibInstanceColor['$']['key'];

                        var r = (rgb[0] / 255);
                        var g = (rgb[1] / 255);
                        var b = (rgb[2] / 255);

                        delete xibInstanceColor['$'].white;
                        delete xibInstanceColor['$'].cocoaTouchSystemColor;

                        xibInstanceColor['$'].colorSpace = "calibratedRGB";
                        xibInstanceColor['$'].alpha = 1;
                        xibInstanceColor['$'].blue = b;
                        xibInstanceColor['$'].green = g;
                        xibInstanceColor['$'].red = r;

                        if (this.colors !== undefined) {

                            console.log("replaced " + colorKey + " in " + this.viewType + " from " + this.colors[colorKey].hexColor + " => " + replacement[replacementKey].value);

                            this.colors[colorKey].hexColor = replacement[replacementKey].value;
                            this.colors[colorKey].rgba.r = r;
                            this.colors[colorKey].rgba.g = g;
                            this.colors[colorKey].rgba.b = b;
                            this.colors[colorKey].rgba.a = 1;
                        }
                    });
                }
                else {

                    xibInstance = this.removeNilColorKey(xibInstance, replacementKey);

                    xibInstance.color = new Array();
                    xibInstance.color[0] = this.colorObject(replacementKey, rgb);

                    console.log("inserted " + replacementKey + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementKey].value);
                }
            });
        }
    }

    parseBarButtonItem(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIBarButtonItem" : xibObject['$']['customClass']);
        this.key = xibObject['$'].key;
        this.title = xibObject['$'].title;
        this.viewKey = "barButtonItem";
        this.viewType = "UIBarButtonItem";
    }

    viewKeyString() { return ("barButtonItem"); }
}

class UIButton extends UIView {

    constructor(xibObject) {

        super(xibObject, "button");

        this.buttonColorKeys = [ 'titleColor', 'titleShadowColor' ];

        this.parseButton(xibObject);
    }

    replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType) {

        if (viewType !== undefined && viewType !== this.viewType) {
            return;
        }

        if (this.buttonColorKeys.indexOf(colorKey) !== -1) {

            if (this.colors !== undefined && this.colors[colorKey] !== undefined) {

                if (colorValue === undefined || this.colors[colorKey].hexColor == colorValue) {

                    this.replaced = (this.replaced === undefined ? new Array() : this.replaced);
                    var replacement = new Object();

                    replacement[colorKey] = new Object();
                    if (state !== undefined) replacement[colorKey].state = state;
                    if (stateTitle !== undefined) replacement[colorKey].stateTitle = stateTitle;
                    replacement[colorKey].value = replaceValue;

                    this.replaced[this.replaced.length] = replacement;
                }
            }
            else if (colorValue === undefined) {

                this.replaced = (this.replaced === undefined ? new Array() : this.replaced);
                var replacement = new Object();

                replacement[colorKey] = new Object();
                if (state !== undefined) replacement[colorKey].state = state;
                if (stateTitle !== undefined) replacement[colorKey].stateTitle = stateTitle;

                replacement[colorKey].value = replaceValue;

                this.replaced[this.replaced.length] = replacement;
                this.makeColor(undefined, colorKey, replaceValue);
            }
        }
        else super.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);
    }

    replaceXibColors(xibInstance, replacement) {

        var replacementColorKey = Object.keys(replacement)[0];

        if (replacementColorKey == "titleColor" || replacementColorKey == "titleShadowColor") {

            var view = this.viewFromXibInstance(xibInstance);
            var viewStates = view.state;
            var colorReplaced = false;

            if (viewStates !== undefined) {

                viewStates.forEach((viewState, viewStateIndex) => {

                    if ((replacement[replacementColorKey].state === undefined && viewState['$'].key == "normal") ||
                        replacement[replacementColorKey].state == viewState['$'].key) {

                        var rgb = mod_hexRGB(replacement[replacementColorKey].value);
                        var viewStateColors = view.state[viewStateIndex].color;

                        var r = (rgb[0] / 255);
                        var g = (rgb[1] / 255);
                        var b = (rgb[2] / 255);

                        if (viewStateColors !== undefined) {
                            
                            viewStateColors.forEach((viewStateColor, viewStateColorIndex) => {

                                if (viewStateColor['$'].key == replacementColorKey) {

                                    delete viewStateColor['$'].white;
                                    delete viewStateColor['$'].cocoaTouchSystemColor;

                                    viewStateColor['$'].colorSpace = "calibratedRGB";
                                    viewStateColor['$'].alpha = 1;
                                    viewStateColor['$'].blue = b;
                                    viewStateColor['$'].green = g;
                                    viewStateColor['$'].red = r;

                                    colorReplaced = true;

                                    console.log("replaced " + viewStateColor['$'].key + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementColorKey].value);
                                }
                            });
                        }
                        if (!colorReplaced) {

                            var colorObject = new Object();
                            var colorLength = view.state[viewStateIndex].color.length;

                            colorObject['$'] = new Object();
                            colorObject['$'].alpha = 1;
                            colorObject['$'].blue = b;
                            colorObject['$'].colorSpace = "calibratedRGB";
                            colorObject['$'].green = g;
                            colorObject['$'].key = replacementColorKey;
                            colorObject['$'].red = r;

                            if (view.state[viewStateIndex].color === undefined) view.state[viewStateIndex].color = new Object();
                            
                            view.state[viewStateIndex].color[colorLength] = colorObject;

                            console.log("inserted " + replacementColorKey + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementColorKey].value);
                        }
                    }
                });
            }
        }
        else {

            xibInstance = super.replaceXibColors(xibInstance, replacement);
        }
        
        return (xibInstance);
    }

    parseButton(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIButton" : xibObject['$']['customClass']);
        this.viewKey = "button";
        this.viewType = "UIButton";

        if (xibObject.state !== undefined) {

            this.states = new Object();
            xibObject.state.forEach((state, stateIndex) => {

                var stateKey = state['$'].key;

                if (state.color !== undefined) {

                    var colorKey = state.color[0]['$']['key'];
                    var rgba = this.extractColor(state.color[0]);
                    var normalizedRGBA = this.normalizeRGBA(rgba);
                    this.makeColor(normalizedRGBA, colorKey);
                    this.states[stateKey] = {
                        colorKey: this.colors
                    };
                }
            });
            delete this.colors;
        }
    }

    viewKeyString() { return ("button"); }
}

class UICollectionView extends UIView {

    constructor(xibObject) {

        super(xibObject, "collectionView");

        this.parseCollectionView(xibObject);
    }

    parseCollectionView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UICollectionView" : xibObject['$']['customClass']);
        this.viewKey = "collectionView";
        this.viewType = "UICollectionView";
    }

    viewKeyString() { return ("collectionView"); }
}

class UICollectionViewCell extends UIView {

    constructor(xibObject, viewKey) {

        super(xibObject, viewKey);

        this.parseCollectionViewCell(xibObject);
    }

    parseCollectionViewCell(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UICollectionViewCell" : xibObject['$']['customClass']);
        this.viewType = "UICollectionViewCell";
        
        if (xibObject.view !== undefined) {
            if (xibObject.view[0].subviews !== undefined) {
                this.parseSubviews(xibObject.view[0].subviews);
            }
            //some collection view cells contain the color attribute within the view xml tag of the collectionViewCell xml tag of the xib file.
            var colorInstance = xibObject.view[0].color;
            if (colorInstance !== undefined) {

                if (colorInstance instanceof Array) {

                    for (var colorIndex = 0; colorIndex < colorInstance.length; colorIndex++) {

                        var colorKey = colorInstance[colorIndex]['$']['key'];
                        var rgba = this.extractColor(colorInstance[colorIndex]);
                        var normalizedRGBA = this.normalizeRGBA(rgba);
                        this.makeColor(normalizedRGBA, colorKey);
                        this.colors[colorKey].rgba = rgba;
                    }
                }
                else {

                    var colorKey = color['key'];
                    var rgba = this.extractColor(colorInstance);
                    var normalizedRGBA = this.normalizeRGBA(rgba);
                    this.makeColor(normalizedRGBA, colorKey);
                    this.colors[colorKey].rgba = rgba;
                }
            }
        }
        var colorInstance = xibObject.color;
        if (colorInstance !== undefined) {

            if (colorInstance instanceof Array) {

                for (var colorIndex = 0; colorIndex < colorInstance.length; colorIndex++) {

                    var colorKey = colorInstance[colorIndex]['$']['key'];
                    var rgba = this.extractColor(colorInstance[colorIndex]);
                    var normalizedRGBA = this.normalizeRGBA(rgba);
                    this.makeColor(normalizedRGBA, colorKey);
                    this.colors[colorKey].rgba = rgba;
                }
            }
            else {

                var colorKey = color['key'];
                var rgba = this.extractColor(colorInstance);
                var normalizedRGBA = this.normalizeRGBA(rgba);
                this.makeColor(normalizedRGBA, colorKey);
                this.colors[colorKey].rgba = rgba;
            }
        }
        if (xibObject.subviews !== undefined) {

            this.parseSubviews(xibObject.subviews);
        }
    }

    replaceXibColors(xibInstance, replacement) {

        var tempXMLPath = this.xmlPath;

        if (this.viewKey != "collectionReusableView") {

            this.xmlPath = tempXMLPath.substring(0, tempXMLPath.length - 7);
        }
        xibInstance = super.replaceXibColors(xibInstance, replacement);
        this.xmlPath = tempXMLPath;

        return (xibInstance);
    }

    viewKeyString() { return (this.viewKey); }
}

class UIDatePicker extends UIView {

    constructor(xibObject) {

        super(xibObject, "datePicker");

        this.parseDatePicker(xibObject);
    }

    parseDatePicker(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIDatePicker" : xibObject['$']['customClass']);
        this.viewKey = "datePicker";
        this.viewType = "UIDatePicker";
    }

    viewKeyString() { return ("datePicker"); }
}

class UIImageView extends UIView {

    constructor(xibObject) {

        super(xibObject, "imageView");

        this.parseImageView(xibObject);
    }

    parseImageView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIImageView" : xibObject['$']['customClass']);
        this.viewKey = "imageView";
        this.viewType = "UIImageView";
    }

    viewKeyString() { return "imageView"; }
}

class UILabel extends UIView {

    constructor(xibObject) {

        super(xibObject, "label");

        this.parseLabel(xibObject);
    }

    parseLabel(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UILabel" : xibObject['$']['customClass']);
        this.labelText = xibObject['$'].text;
        this.viewKey = "label";
        this.viewType = "UILabel";
    }

    viewKeyString() { return ("label"); }
}

class UINavigationBar extends UIView {

    constructor(xibObject) {

        super(xibObject, "navigationBar");

        this.parseNavigationBar(xibObject);
    }

    replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType) {

        super.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);

        if (this.items !== undefined) {
            this.items.forEach((navigationItem, navigationItemIndex) => {
                navigationItem.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);
            });
        }
    }

    replaceXibColors(xibInstance, replacement) {

        var xibView = this.viewFromXibInstance(xibInstance);
        var replacementKey = Object.keys(replacement)[0];

        if (replacementKey == "textColor") {

            if (xibView.textAttributes[0].color !== undefined) {

                xibView.textAttributes[0].color.forEach((xibViewColor, xibViewColorIndex) => {

                    var colorKey = xibViewColor['$'].key;

                    if (colorKey == replacementKey) {

                        var rgb = mod_hexRGB(replacement[replacementKey].value);

                        var r = (rgb[0] / 255);
                        var g = (rgb[1] / 255);
                        var b = (rgb[2] / 255);

                        delete xibViewColor['$'].white;
                        delete xibViewColor['$'].cocoaTouchSystemColor;

                        xibViewColor['$'].colorSpace = "calibratedRGB";
                        xibViewColor['$'].alpha = 1;
                        xibViewColor['$'].blue = b;
                        xibViewColor['$'].green = g;
                        xibViewColor['$'].red = r;

                        if (this.colors !== undefined) {

                            console.log("replaced " + colorKey + " in " + this.viewType + " from " + this.colors[colorKey].hexColor + " => " + replacement[replacementKey].value);

                            this.colors[colorKey].hexColor = replacement[replacementKey].value;
                            this.colors[colorKey].rgba.r = r;
                            this.colors[colorKey].rgba.g = g;
                            this.colors[colorKey].rgba.b = b;
                            this.colors[colorKey].rgba.a = 1;
                        }
                    }
                });
            }
            else {

                xibView = this.removeNilColorKey(xibView, replacementKey);

                xibView.textAttributes[0].color = new Array();
                xibView.textAttributes[0].color[0] = this.colorObject(replacementKey, rgb);

                console.log("inserted " + replacementKey + " for " + this.viewType + " with: " + rgb + "/" + replacement[replacementKey].value);
            }
        }
        else {

            super.replaceXibColors(xibInstance, replacement);
        }

        xibView.items.forEach((itemView, itemViewIndex) => {
            this.items[itemViewIndex].replaceXibColors(itemView, replacement);
        });
    }

    parseNavigationBar(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UINavigationBar" : xibObject['$']['customClass']);
        this.viewKey = "navigationBar";
        this.viewType = "UINavigationBar";

        if (xibObject.items !== undefined) {

            this.items = new Array();
            
            xibObject.items.forEach((navigationItem, navigationItemIndex) => {
                this.items[this.items.length] = new UINavigationItem(navigationItem.navigationItem[0]);
            });
        }
        if (xibObject.textAttributes !== undefined) {

            this.colors = new Object();
            xibObject.textAttributes.forEach((textAttrib, textAttribIndex) => {

                if (textAttrib.color !== undefined) {

                    textAttrib.color.forEach((textAttribColor, textAttribColorIndex) => {

                        var colorKey = textAttribColor['$']['key'];
                        var rgba = this.extractColor(textAttribColor);
                        var normalizedRGBA = this.normalizeRGBA(rgba);
                        this.makeColor(normalizedRGBA, colorKey);
                        this.colors[colorKey].rgba = rgba;
                    });
                }
            });
        }
    }

    hasChanges() {

        var changes = super.hasChanges();

        if (changes == false && this.items !== undefined) {
            this.items.forEach((subItem) => {
                changes = subItem.hasChanges();
            });
        }

        return (changes);
    }

    willCommit(xibInstance) {

        if (this.replaced === undefined) return;

        this.replaced.forEach((replacement, replacementIndex) => {
            this.replaceXibColors(xibInstance, replacement);
        });
    }

    viewKeyString() { return ("navigationBar"); }
}

class UINavigationItem extends UIView {

    constructor(xibObject) {

        super(xibObject, "navigationItem");

        this.parseNavigationItem(xibObject);
    }

    replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType) {

        super.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);

        if (this.barButtonItems !== undefined) {

            this.barButtonItems.forEach((barButtonItem, barButtonItemIndex) => {
                barButtonItem.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);
            });
        }
    }

    replaceXibColors(xibInstance, replacement) {

        xibInstance.navigationItem[0].barButtonItem.forEach((barButtonView, barButtonViewIndex) => {

            this.barButtonItems[barButtonViewIndex].replaceXibColors(barButtonView, replacement);
        });
    }

    parseNavigationItem(xibObject) {

        // this.className = (xibObject['$']['customClass'] == undefined ? "UINavigationItem" : xibObject['$']['customClass']);
        this.className = "UINavigationItem";
        this.viewKey = "navigationItem";
        this.viewType = "UINavigationItem";

        this.barButtonItems = new Array();
        xibObject.barButtonItem.forEach((barButtonItem, barButtonItemIndex) => {

            this.barButtonItems[this.barButtonItems.length] = new UIBarButtonItem(barButtonItem);
        });
    }

    hasChanges() {

        var changes = super.hasChanges();

        if (changes == false && this.barButtonItems !== undefined) {

            this.barButtonItems.forEach((bbtItem) => {

                changes = bbtItem.hasChanges();
            });
        }

        return (changes);
    }

    viewKeyString() { return ("navigationItem"); }
}

class UIPickerView extends UIView {

    constructor(xibObject) {

        super(xibObject, "pickerView");

        this.parsePickerView(xibObject);
    }

    parsePickerView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIPickerView" : xibObject['$']['customClass']);
        this.viewKey = "pickerView";
        this.viewType = "UIPickerView";
    }

    viewKeyString() { return ("pickerView"); }
}

class UIScrollView extends UIView {

    constructor(xibObject) {

        super(xibObject, "scrollView");

        this.parseScrollView(xibObject);
    }

    parseScrollView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIScrollView" : xibObject['$']['customClass']);
        this.viewKey = "scrollView";
        this.viewType = "UIScrollView";
    }

    viewKeyString() { return ("scrollView"); }
}

class UISearchBar extends UIView {

    constructor(xibObject) {

        super(xibObject, "searchBar");

        this.parseSearchBar(xibObject);
    }

    parseSearchBar(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UISearchBar" : xibObject['$']['customClass']);
        this.viewKey = "searchBar";
        this.viewType = "UISearchBar";
    }

    viewKeyString() { return ("searchBar"); }
}

class UISegmentedControl extends UIView {

    constructor(xibObject) {

        super(xibObject, "segmentedControl");

        this.parseSegmentedControl(xibObject);
    }

    parseSegmentedControl(xibObject) {
     
        this.className = (xibObject['$']['customClass'] == undefined ? "UISegmentedControl" : xibObject['$']['customClass']);
        this.viewKey = "segmentedControl";
        this.viewType = "UISegmentedControl";
    }

    viewKeyString() { return ("segmentedControl"); }
}

class UIStepper extends UIView {

    constructor(xibObject) {

        super(xibObject, "stepper");

        this.parseStepper(xibObject);
    }

    parseStepper(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIStepper" : xibObject['$']['customClass']);
        this.viewKey = "stepper";
        this.viewType = "UIStepper";
    }

    viewKeyString() { return ("stepper"); }
}

class UISwitch extends UIView {

    constructor(xibObject) {

        super(xibObject, "switch");

        this.parseSwitch(xibObject);
    }

    parseSwitch(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UISwitch" : xibObject['$']['customClass']);
        this.viewKey = "switch";
        this.viewType = "UISwitch";
    }

    viewKeyString() { return ("switch"); }
}

class UITabBar extends UIView {

    constructor(xibObject) {

        super(xibObject, "tabBar");

        this.parseTabBar(xibObject);
    }

    parseTabBar(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UITabBar" : xibObject['$']['customClass']);
        this.viewKey = "tabBar";
        this.viewType = "UITabBar";
    }

    viewKeyString() { return ("tabBar"); }
}

class UITabBarItem extends UIView {

    constructor(xibObject) {

        super(xibObject, "tabBarItem");

        this.parseTabBarItem(xibObject);
    }

    parseTabBarItem(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UITabBarItem" : xibObject['$']['customClass']);
        this.viewKey = "tabBarItem";
        this.viewType = "UITabBarItem";
    }

    viewKeyString() { return ("tabBar"); }
}

class UITableView extends UIView {

    constructor(xibObject) {

        super(xibObject, "tableView");

        this.parseTableView(xibObject);
    }

    parseTableView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UITableView" : xibObject['$']['customClass']);
        this.viewKey = "tableView";
        this.viewType = "UITableView";
    }

    viewKeyString() { return ("tableView"); }
}

class UITableViewCell extends UIView {

    constructor(xibObject) {

        super(xibObject, "tableViewCell.0.tableViewCellContentView");

        this.parseTableViewCell(xibObject);
    }

    parseTableViewCell(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UITableViewCell" : xibObject['$']['customClass']);
        this.viewKey = "tableViewCell.0.tableViewCellContentView.0";
        this.viewType = "UITableViewCell";

        if (xibObject.tableViewCellContentView) {

            var tableCellContentView = xibObject.tableViewCellContentView[0];

            if (tableCellContentView.subviews !== undefined) {

                this.parseSubviews(tableCellContentView.subviews);
            }
            if (tableCellContentView.color !== undefined) {

                tableCellContentView.color.forEach((color, colorIndex) =>  {

                    var colorKey = color['$']['key'];
                    var rgba = this.extractColor(color);
                    var normalizedRGBA = this.normalizeRGBA(rgba);
                    this.makeColor(normalizedRGBA, colorKey);
                    this.colors[colorKey].rgba = rgba;
                });
            }
            else if (xibObject.color !== undefined) {

                xibObject.color.forEach((color, colorIndex) => {

                    var colorKey = color['$']['key'];
                    var rgba = this.extractColor(color);
                    var normalizedRGBA = this.normalizeRGBA(rgba);
                    this.makeColor(normalizedRGBA, colorKey);
                    this.colors[colorKey].rgba = rgba;
                });
            }
        }
    }

    replaceXibColors(xibInstance, replacement) {

        var tempXMLPath = this.xmlPath;
        this.xmlPath = this.xmlPath.substring(0, this.xmlPath.length - 27);
        var tableCell = this.viewFromXibInstance(xibInstance);
        var didReplace = false;

        if (tableCell !== undefined && tableCell.color !== undefined) {
            
            super.replaceXibColors(xibInstance, replacement);
            this.xmlPath = tempXMLPath;
            didReplace = true;
        }
        tableCell = this.viewFromXibInstance(xibInstance);
        if (!didReplace || (tableCell !== undefined && tableCell.color !== undefined)) {
            super.replaceXibColors(xibInstance, replacement);
        }
    }

    viewKeyString() { return ("tableViewCell.0.tableViewCellContentView"); }
}

class UITextField extends UIView {

    constructor(xibObject) {

        super(xibObject, "textField");

        this.parseTextField(xibObject);
    }

    parseTextField(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UITextField" : xibObject['$']['customClass']);
        this.viewKey = "textField";
        this.viewType = "UITextField";
    }

    viewKeyString() { return ("textField"); }
}

class UITextView extends UIView {

    constructor(xibObject) {

        super(xibObject, "textView");
        
        this.parseTextView(xibObject);
    }

    parseTextView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UITextField" : xibObject['$']['customClass']);
        this.viewKey = "textView";
        this.viewType = "UITextView";
    }

    viewKeyString() { return ("textView"); }
}

class UIToolbar extends UIView {

    constructor(xibObject) {

        super(xibObject, "toolbar");

        this.parseToolbar(xibObject);
    }

    replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType) {

        super.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);

        if (this.items !== undefined) {

            this.items.forEach((barButtonItem, barButtonItemIndex) => {
                barButtonItem.replace(colorKey, colorValue, colorExclude, replaceValue, state, stateTitle, viewType);
            });
        }
    }

    replaceXibColors(xibInstance, replacement) {

        super.replaceXibColors(xibInstance, replacement);

        var xibView = this.viewFromXibInstance(xibInstance);

        xibView.items[0].barButtonItem.forEach((xibBarButtonItem, xibBarButtonItemIndex) => {

            xibInstance = this.items[xibBarButtonItemIndex].replaceXibColors(xibBarButtonItem, replacement);
        });
    }

    parseToolbar(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIToolbar" : xibObject['$']['customClass']);
        this.viewKey = "toolbar";
        this.viewType = "UIToolbar";

        if (xibObject.items !== undefined) {

            this.items = new Array();
            xibObject.items.forEach((item, itemIndex) => {

                if (item.barButtonItem !== undefined) {

                    item.barButtonItem.forEach((barButtonItem, barButtonItemIndex) => {
                        this.items[this.items.length] = new UIBarButtonItem(barButtonItem);
                    });
                }
            });
        }
    }

    hasChanges() {

        var changes = super.hasChanges();

        if (changes == false && this.items !== undefined) {

            this.items.forEach((subItem) => {

                changes = subItem.hasChanges();
            });
        }

        return (changes);
    }

    willCommit(xibInstance) {

        if (this.replaced === undefined) return;

        this.replaced.forEach((replacement, replacementIndex) => {
            this.replaceXibColors(xibInstance, replacement);
        });
    }

    viewKeyString() { return ("toolbar"); }
}

/**
 * returns an instance of a view from the given xibKey
 * 
 * @param xibKey - One of activityIndicatorView, collectionViewCell, collectionReusableView, tableView, tableViewCell, toolbar, view
 * @param xibInstance - xml parsed xib instance
 * @param xibFile - path to the xib file
 */
function viewInstance(xibKey, xibInstance, xibFile) {

    var unknownElementTypes = [ 'placeholder', 'screenEdgePanGestureRecognizer', 'tapGestureRecognizer', 'swipeGestureRecognizer' ];
    if (mod_viewKeys.indexOf(xibKey) === -1 && unknownElementTypes.indexOf(xibKey) === -1) {

        console.log("[" + xibKey + "] unknown key for creating view instance: ");
        return;
    }

    var viewInstance = undefined;
    xibFile = (xibFile === undefined ? "" : xibFile);

    if (xibKey == "activityIndicatorView") {

        viewInstance = new UIActivityIndicatorView(xibInstance);
    }
    if (xibKey == "barButtonItem") {

        viewInstance = new UIBarButtonItem(xibInstance);
    }
    if (xibKey == "button") {

        viewInstance = new UIButton(xibInstance);
    }
    if (xibKey == "collectionView") {

        viewInstance = new UICollectionView(xibInstance);
    }
    if (xibKey == "collectionViewCell") {

        viewInstance = new UICollectionViewCell(xibInstance, "collectionViewCell.0.view");
    }
    if (xibKey == "collectionReusableView") {

        viewInstance = new UICollectionViewCell(xibInstance, "collectionReusableView");
    }
    if (xibKey == "datePicker") {

        viewInstance = new UIDatePicker(xibInstance);
    }
    if (xibKey == "label") {

        viewInstance = new UILabel(xibInstance);
    }
    if (xibKey == "navigationBar") {

        viewInstance = new UINavigationBar(xibInstance);
    }
    if (xibKey == "navigationItem") {

        viewInstance = new UINavigationItem(xibInstance);
    }
    if (xibKey == "pickerView") {

        viewInstance = new UIPickerView(xibInstance);
    }
    if (xibKey == "scrollView") {

        viewInstance = new UIScrollView(xibInstance);
    }
    if (xibKey == "searchBar") {

        viewInstance = new UISearchBar(xibInstance);
    }
    if (xibKey == "stepper") {

        viewInstance = new UIStepper(xibInstance);
    }
    if (xibKey == "switch") {

        viewInstance = new UISwitch(xibInstance);
    }
    if (xibKey == "tabBar") {

        viewInstance = new UITabBar(xibInstance);
    }
    if (xibKey == "tabBarItem") {

        viewInstance = new UITabBarItem(xibInstance);
    }
    if (xibKey == "tableView") {

        viewInstance = new UITableView(xibInstance);
    }
    if (xibKey == "tableViewCell") {

        viewInstance = new UITableViewCell(xibInstance);
    }
    if (xibKey == "textField") {

        viewInstance = new UITextField(xibInstance);
    }
    if (xibKey == "textView") {

        viewInstance = new UITextView(xibInstance);
    }
    if (xibKey == "toolbar") {

        viewInstance = new UIToolbar(xibInstance);
    }
    if (xibKey == "view") {

        viewInstance = new UIView(xibInstance);
    }

    if (viewInstance !== undefined) {

        viewInstance.xibName = mod_dir.lastPathComponent(xibFile);
        viewInstance = constructSubviewPaths(viewInstance);
    }

    return (viewInstance);
}

function constructSubviewPaths(view, parentXMLPath) {

    if (view.subviews !== undefined) {

        parentXMLPath = (parentXMLPath === undefined ? view.xmlPath : parentXMLPath);
        view.xmlPath = parentXMLPath;

        var viewKeyCounts = new Object();
        var viewKeyCount;

        view.subviews.forEach((subview, subviewIndex) => {

            viewKeyCount = 0;
            viewKeyCount = (viewKeyCounts[subview.viewKey] === undefined ? viewKeyCount : viewKeyCounts[subview.viewKey] + 1);
            viewKeyCounts[subview.viewKey] = viewKeyCount;

            subview.xmlPath = view.xmlPath + ".subviews.0." + subview.viewKey + "." + viewKeyCount;

            constructSubviewPaths(subview, subview.xmlPath);
        });
    }

    return (view);
}

module.exports = {

    UIActivityIndicatorView: UIActivityIndicatorView,
    UIBarButtonItem: UIBarButtonItem,
    UIButton: UIButton,
    UICollectionView: UICollectionView,
    UICollectionViewCell: UICollectionViewCell,
    UIDatePicker: UIDatePicker,
    UIImageView: UIImageView,
    UILabel: UILabel,
    UINavigationBar: UINavigationBar,
    UINavigationItem: UINavigationItem,
    UIPickerView: UIPickerView,
    UIScrollView: UIScrollView,
    UISearchBar: UISearchBar,
    UISegmentedControl: UISegmentedControl,
    UIStepper: UIStepper,
    UISwitch: UISwitch,
    UITabBar: UITabBar,
    UITabBarItem: UITabBarItem,
    UITableView: UITableView,
    UITableViewCell: UITableViewCell,
    UITextField: UITextField,
    UITextView: UITextView,
    UIToolbar: UIToolbar,
    UIView: UIView,

    viewInstance: viewInstance,

    colorKeys: mod_colorKeys,
    viewKeys: mod_viewKeys,
    viewTypes: mod_viewTypes
}