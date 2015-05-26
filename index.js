"use strict";

var LoaderUtils = require("loader-utils");

module.exports = function (content) {
    if ( this.cacheable ) { this.cacheable(); }
    var id = this._compilation.__iconFontPlugin.addIcon(content);
    var query = LoaderUtils.parseQuery(this.query);
    var template = query.template || "module.exports = __ICON__;";
    var icon = "var __ICON__ = require(\"iconfont-loader\")." + id + ";\n";
    return icon + template;
};
