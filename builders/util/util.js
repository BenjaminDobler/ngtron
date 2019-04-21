"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const rxjs_1 = require("rxjs");
exports.BUILD_IN_NODE_MODULES = ["fs", "path"];
exports.BUILD_IN_ELECTRON_MODULES = ["electron", "app", "shell"];
function isMac() {
    return /^darwin/.test(process.platform);
}
exports.isMac = isMac;
exports.noneElectronWebpackConfigTransformFactory = (options, buildElectronOptions, context) => ({ root }, browserWebpackConfig) => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    let EXTERNALS = Object.keys(externalDependencies);
    EXTERNALS = [...EXTERNALS, ...exports.BUILD_IN_ELECTRON_MODULES, ...exports.BUILD_IN_NODE_MODULES];
    browserWebpackConfig.externals = [
        (function () {
            return function (context, request, callback) {
                if (EXTERNALS.indexOf(request) >= 0) {
                    return callback(null, "'undefined'");
                }
                return callback();
            };
        })()
    ];
    return rxjs_1.of(browserWebpackConfig);
};
exports.electronServeWebpackConfigTransformFactory = (options, buildElectronOptions, context) => {
    return webpackConfig => {
        const externalDependencies = buildElectronOptions.electronPackage.dependencies;
        const rootNodeModules = path_1.join(context.workspaceRoot, "node_modules");
        let EXTERNALS = Object.keys(externalDependencies);
        EXTERNALS = [...EXTERNALS, ...exports.BUILD_IN_ELECTRON_MODULES, ...exports.BUILD_IN_NODE_MODULES];
        webpackConfig.externals = [
            (function () {
                return function (context, request, callback) {
                    if (EXTERNALS.indexOf(request) >= 0) {
                        if (externalDependencies.hasOwnProperty(request)) {
                            const modulePath = path_1.join(rootNodeModules, request);
                            return callback(null, "require('" + modulePath + "')");
                        }
                        return callback(null, "require('" + request + "')");
                    }
                    return callback();
                };
            })()
        ];
        webpackConfig.target = "electron-renderer";
        return webpackConfig;
    };
};
exports.electronBuildWebpackConfigTransformFactory = (options, buildElectronOptions, context) => {
    return webpackConfig => {
        const externalDependencies = buildElectronOptions.electronPackage.dependencies;
        let EXTERNALS = Object.keys(externalDependencies);
        EXTERNALS = [...EXTERNALS, ...exports.BUILD_IN_ELECTRON_MODULES, ...exports.BUILD_IN_NODE_MODULES];
        webpackConfig.externals = [
            (function () {
                return function (context, request, callback) {
                    if (EXTERNALS.indexOf(request) >= 0) {
                        return callback(null, "require('" + request + "')");
                    }
                    return callback();
                };
            })()
        ];
        webpackConfig.target = "electron-renderer";
        webpackConfig.optimization.splitChunks = false; // What the F!
        return webpackConfig;
    };
};
//# sourceMappingURL=util.js.map