"use strict";

var path = require("path");
var crypto = require("crypto");
var Vinyl = require("vinyl");
var iconfont = require("gulp-iconfont");
var LoaderUtils = require("loader-utils");
var RawSource = require("webpack-core/lib/RawSource");
var ModuleAliasPlugin = require("enhanced-resolve/lib/ModuleAliasPlugin");
var NullFactory = require("webpack/lib/NullFactory");
var ConstDependency = require("webpack/lib/dependencies/ConstDependency");

function jsonDependency (objectFactory) {
    return function (expr) {
        var dep = new ConstDependency("(" + JSON.stringify(objectFactory()) + ")", expr.range);
        dep.loc = expr.loc;
        this.state.current.addDependency(dep);
        return true;
    };
}

function IconFontPlugin (options) {
    options = options || {};
    this.options = {
        fontName: options.fontName || "myfont",
        filenameTemplate: options.filenameTemplate || {
            name: "[name]-[hash].[ext]",
        },
    };

    this.codepoints = [];
    this.styles = {};
}

IconFontPlugin.prototype.apply = function (compiler) {
    var plugin = this;

    compiler.resolvers.normal.apply(new ModuleAliasPlugin({
        "iconfont-loader": path.join(__dirname, "template.js"),
    }));

    var cache = {};

    compiler.plugin("compilation", function (compilation) {
        var cacheInvalid = false;

        compilation.dependencyFactories.set(ConstDependency, new NullFactory());
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());

        compilation.__iconFontPlugin = { addIcon: function (content) {
            cacheInvalid = true;
            var id = "i" + crypto.createHash("sha1").update(new Buffer(content)).digest("hex");
            cache[id] = content;
            return id;
        } };

        compilation.plugin("optimize-tree", function (chunks, modules, callback) {
            if ( !cacheInvalid ) {
                return callback();
            }

            var stream = iconfont(plugin.options);

            plugin.codepoints = [];
            plugin.styles = {
                fontName: plugin.options.fontName,
            };

            stream.on("data", function (vinyl) {
                var assetType = path.extname(vinyl.path).substr(1);
                var assetName = LoaderUtils.interpolateName({
                    resourcePath: vinyl.path,
                }, plugin.options.filenameTemplate.name, {
                    content: vinyl.contents,
                    regExp: plugin.options.filenameTemplate.regExp,
                });
                plugin.styles[assetType] = assetName;
                compilation.assets[assetName] = new RawSource(vinyl.contents);
            });

            stream.on("codepoints", function (_codepoints) {
                plugin.codepoints = _codepoints;
            });

            stream.on("error", callback);

            stream.on("end", function () {
                var module = modules.filter(function (module) {
                    return module.rawRequest === "iconfont-loader";
                })[0];

                compilation.rebuildModule(module, callback);
            });

            Object.keys(cache).map(function (id) {
                return new Vinyl({
                    path: id + ".svg",
                    contents: new Buffer(cache[id]),
                });
            }).forEach(function (vinyl) {
                stream.write(vinyl);
            });

            process.nextTick(function () {
                stream.end();
            });
        });
    });

    compiler.parser.plugin("expression __FONT_ICON_PLUGIN_CODEPOINTS__", jsonDependency(function () {
        return plugin.codepoints;
    }));

    compiler.parser.plugin("expression __FONT_ICON_PLUGIN_STYLES__", jsonDependency(function () {
        return plugin.styles;
    }));
};

module.exports = IconFontPlugin;
