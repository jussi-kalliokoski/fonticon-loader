"use strict";

var CODEPOINTS = __FONT_ICON_PLUGIN_CODEPOINTS__;
var STYLES = __FONT_ICON_PLUGIN_STYLES__;

function fontAsset (type, format, query) {
    return "url(" + JSON.stringify(__webpack_public_path__ + STYLES[type] + (query || "")) + ") format(" + JSON.stringify(format || type) + ")";
}

var css =
    "@font-face{" +
        "font-family:" + JSON.stringify(STYLES.fontName) + ";" +
        "font-weight:normal;" +
        "src:" + fontAsset("eot") + ";" +
        "src:" +
            fontAsset("eot", "eot", "?#iefix") + "," +
            fontAsset("woff") + "," +
            fontAsset("ttf", "truetype") + "," +
            fontAsset("svg", "svg", "#" + STYLES.fontName) + ";" +
    "}";

for ( var i = 0; i < CODEPOINTS.length; i++ ) {
    exports[CODEPOINTS[i].name] = {
        text: String.fromCharCode(CODEPOINTS[i].codepoint),
        fontName: STYLES.fontName,
    };
}

exports.css = css;
exports.fontName = STYLES.fontName;
