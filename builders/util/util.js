"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
exports.BUILD_IN_NODE_MODULES = ["fs", "path"];
exports.BUILD_IN_ELECTRON_MODULES = ["electron", "app", "shell"];
function isMac() {
    return /^darwin/.test(process.platform);
}
exports.isMac = isMac;
exports.noneElectronWebpackConfigTransformFactory = (options, buildElectronOptions, context) => {
    console.log("Electron Browser Serve Webpack");
    return webpackConfig => {
        const externalDependencies = buildElectronOptions.electronPackage.dependencies;
        let EXTERNALS = Object.keys(externalDependencies);
        EXTERNALS = [...EXTERNALS, ...exports.BUILD_IN_ELECTRON_MODULES, ...exports.BUILD_IN_NODE_MODULES];
        webpackConfig.externals = [
            (function () {
                return function (context, request, callback) {
                    if (EXTERNALS.indexOf(request) >= 0) {
                        return callback(null, "'undefined'");
                    }
                    return callback();
                };
            })()
        ];
        webpackConfig.optimization.splitChunks = false; // What the F!
        return webpackConfig;
    };
};
exports.electronServeWebpackConfigTransformFactory = (options, buildElectronOptions, context) => {
    console.log("Electron Serve Webpack");
    return webpackConfig => {
        const externalDependencies = buildElectronOptions.electronPackage.dependencies;
        const rootNodeModules = path_1.join(context.workspaceRoot, "node_modules");
        let EXTERNALS = Object.keys(externalDependencies);
        EXTERNALS = [...EXTERNALS, ...exports.BUILD_IN_ELECTRON_MODULES, ...exports.BUILD_IN_NODE_MODULES];
        webpackConfig.externals = [
            (function () {
                return function (context, request, callback) {
                    console.log("Request ", request);
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
// Package
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
const ts = require("typescript");
function compile(fileNames, options) {
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit();
    let allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
            console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
        }
    });
    let exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
    //process.exit(exitCode);
}
exports.compile = compile;
//# sourceMappingURL=util.js.map