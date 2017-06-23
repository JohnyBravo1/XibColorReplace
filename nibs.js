var mod_dir = require('./../dir');
var mod_fs = require('fs');
var mod_plist = require('plist');
var mod_utils = require('./utils.js');

var mod_colorKeys = [ 'backgroundColor', 'barTintColor', 'sectionIndexBackgroundColor', 
                'sectionIndexColor', 'sectionIndexTrackingBackgroundColor', 'separatorColor',
                 'shadowColor', 'switch', 'textColor', 'tintColor' ];
var mod_viewKeys = [ 'activityIndicatorView', 'button', 'collectionView', 'collectionViewCell', 'collectionReusableView', 
                'imageView', 'label', 'tableView', 'tableViewCell', 'textfield', 'toolbar', 'scrollView', 'searchBar', 'segmentedControl',
                 'view' ];
var mod_viewTypes = [ "UIActivityIndicatorView", "UIButton", "UICollectionView",
                "UICollectionView", "UIImageView", "UILabel", "UIScrollView", 
                "UISearchBar", "UISegmentedControl", "UISwitch", "UITableView", "UITableViewCell", "UITextField",
                "UIToolbar", "UIView" ];

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
        this.parseView(xibObject, viewKey);
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
            if (element.switch !== undefined) {

                parsed = true;
                element.switch.forEach((swtch, swtchIndex) => {
                    subviewInstance = new UISwitch(swtch);
                    subviewInstances[subviewInstances.length] = subviewInstance;
                })
            }
            if (element.textField !== undefined) {

                parsed = true;
                element.textField.forEach((textField, textFieldIndex) => {
                    subviewInstance = new UITextField(textField);
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
        this.viewKey = (viewKey === undefined ? "view" : viewKey);
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
     */
    makeColor(rgba, colorKey) {

        var hexString = "";

        if (rgba.w != 0) {

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
}

class UIActivityIndicatorView extends UIView {
    
    constructor(xibObject) {

        super(xibObject);

        this.parseActivityIndicatorView(xibObject);
    }

    parseActivityIndicatorView(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIActivityIndicatorView" : xibObject['$']['customClass']);
        this.viewKey = "activityIndicatorView";
        this.viewType = "UIActivityIndicatorView";
    }

    viewKeyString() { return ("activityIndicatorView"); }
}

class UIButton extends UIView {

    constructor(xibObject) {

        super(xibObject);

        this.parseButton(xibObject);
    }

    parseButton(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIButton" : xibObject['$']['customClass']);
        this.viewKey = "button";
        this.viewType = "UIButton";
    }

    viewKeyString() { return ("button"); }
}

class UICollectionView extends UIView {

    constructor(xibObject) {

        super(xibObject);

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

    viewKeyString() { return (this.viewKey); }
}

class UIImageView extends UIView {

    constructor(xibObject) {

        super(xibObject);

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

        super(xibObject);

        this.parseLabel(xibObject);
    }

    parseLabel(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UILabel" : xibObject['$']['customClass']);
        this.viewKey = "label";
        this.viewType = "UILabel";
    }

    viewKeyString() { return ("label"); }
}

class UIScrollView extends UIView {

    constructor(xibObject) {

        super(xibObject);

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

        super(xibObject);

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

        super(xibObject);

        this.parseSegmentedControl(xibObject);
    }

    parseSegmentedControl(xibObject) {
     
        this.className = (xibObject['$']['customClass'] == undefined ? "UISearchBar" : xibObject['$']['customClass']);
        this.viewKey = "searchBar";
        this.viewType = "UISearchBar";
    }

    viewKeyString() { return ("segmentedControl"); }
}

class UISwitch extends UIView {

    constructor(xibObject) {

        super(xibObject);

        this.parseSwitch(xibObject);
    }

    parseSwitch(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UISwitch" : xibObject['$']['customClass']);
        this.viewKey = "switch";
        this.viewType = "UISwitch";
    }

    viewKeyString() { return ("switch"); }
}

class UITableView extends UIView {

    constructor(xibObject) {

        super(xibObject);

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

        super(xibObject);

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
        }
    }

    viewKeyString() { return ("tableViewCell.0.tableViewCellContentView"); }
}

class UITextField extends UIView {

    constructor(xibObject) {

        super(xibObject);

        this.parseTextField(xibObject);
    }

    parseTextField(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UITextField" : xibObject['$']['customClass']);
        this.viewKey = "textfield";
        this.viewType = "UITextField";
    }

    viewKeyString() { return ("textfield"); }
}

class UIToolbar extends UIView {

    constructor(xibObject) {

        super(xibObject);

        this.parseToolbar(xibObject);
    }

    parseToolbar(xibObject) {

        this.className = (xibObject['$']['customClass'] == undefined ? "UIToolbar" : xibObject['$']['customClass']);
        this.viewKey = "toolbar";
        this.viewType = "UIToolbar";
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

    var unkownKeys = [ 'placeholder', 'screenEdgePanGestureRecognizer' ];
    if (mod_viewKeys.indexOf(xibKey) === -1 && unkownKeys.indexOf(xibKey) === -1) {

        console.log("[" + xibKey + "] unknown key for creating view instance: ");
        return;
    }

    var viewInstance = undefined;
    xibFile = (xibFile === undefined ? "" : xibFile);

    if (xibKey == "activityIndicatorView") {

        viewInstance = new UIActivityIndicatorView(xibInstance);
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
    if (xibKey == "label") {

        viewInstance = new UILabel(xibInstance);
    }
    if (xibKey == "scrollView") {

        viewInstance = new UIScrollView(xibInstance);
    }
    if (xibKey == "searchBar") {

        viewInstance = new UISearchBar(xibInstance);
    }
    if (xibKey == "switch") {

        viewInstance = new UISwitch(xibInstance);
    }
    if (xibKey == "tableView") {

        viewInstance = new UITableView(xibInstance);
    }
    if (xibKey == "tableViewCell") {

        viewInstance = new UITableViewCell(xibInstance);
    }
    if (xibKey == "textfield") {

        viewInstance = new UITextField(xibInstance);
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
    UICollectionView: UICollectionView,
    UICollectionViewCell: UICollectionViewCell,
    UITableView: UITableView,
    UITableViewCell: UITableViewCell,
    UIScrollView: UIScrollView,
    UISwitch: UISwitch,
    UIToolbar: UIToolbar,
    UIView: UIView,

    viewInstance: viewInstance,

    colorKeys: mod_colorKeys,
    viewKeys: mod_viewKeys,
    viewTypes: mod_viewTypes
}