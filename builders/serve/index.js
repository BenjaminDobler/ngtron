"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const build_angular_1 = require("@angular-devkit/build-angular");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const child_process_1 = require("child_process");
const path_1 = require("path");
const util_1 = require("../util/util");
exports.noneElectronWebpackConfigTransformFactory = (options, buildElectronOptions, context) => ({ root }, browserWebpackConfig) => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    const rootNodeModules = path_1.join(context.workspaceRoot, "node_modules");
    let IGNORES = Object.keys(externalDependencies);
    IGNORES = [
        ...IGNORES,
        ...util_1.BUILD_IN_ELECTRON_MODULES,
        ...util_1.BUILD_IN_NODE_MODULES
    ];
    browserWebpackConfig.externals = [
        (function () {
            return function (context, request, callback) {
                if (IGNORES.indexOf(request) >= 0) {
                    return callback(null, "'undefined'");
                }
                return callback();
            };
        })()
    ];
    return rxjs_1.of(browserWebpackConfig);
};
exports.electronWebpackConfigTransformFactory = (options, buildElectronOptions, context) => ({ root }, browserWebpackConfig) => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    const rootNodeModules = path_1.join(context.workspaceRoot, "node_modules");
    let IGNORES = Object.keys(externalDependencies);
    IGNORES = [
        ...IGNORES,
        ...util_1.BUILD_IN_ELECTRON_MODULES,
        ...util_1.BUILD_IN_NODE_MODULES
    ];
    browserWebpackConfig.externals = [
        (function () {
            return function (context, request, callback) {
                if (IGNORES.indexOf(request) >= 0) {
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
    browserWebpackConfig.target = "electron-renderer";
    return rxjs_1.of(browserWebpackConfig);
};
exports.execute = (options, context) => {
    let serverOptions;
    let buildElectronOptions;
    function setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
            serverOptions = yield context.getTargetOptions(browserTarget);
            const buildOptions = yield context.getTargetOptions({
                project: context.target.project,
                target: "build"
            });
            buildOptions.browserTarget = context.target.project + ":build";
            buildOptions.port = options.port ? options.port : 4200;
            buildOptions.watch = true;
            const electronBuildTarget = architect_1.targetFromTargetString(context.target.project + ":build-electron");
            buildElectronOptions = yield context.getTargetOptions(electronBuildTarget);
            return {
                buildOptions: buildOptions,
                buildElectronOptions: buildElectronOptions
            };
        });
    }
    return rxjs_1.from(setup()).pipe(operators_1.switchMap(opt => {
        const webpackTransformFactory = context.target.target === "serve-electron"
            ? exports.electronWebpackConfigTransformFactory
            : exports.noneElectronWebpackConfigTransformFactory;
        return build_angular_1.executeDevServerBuilder(opt.buildOptions, context, {
            webpackConfiguration: webpackTransformFactory(opt.buildOptions, opt.buildElectronOptions, context)
        });
    }), operators_1.filter((val, index) => index < 1), operators_1.switchMap((x) => openElectron(x, options, context)), operators_1.mapTo({ success: true }));
};
function isMac() {
    return /^darwin/.test(process.platform);
}
function openElectron(x, options, context) {
    return new rxjs_1.Observable(observer => {
        console.log("Open Electron ", x.port);
        if (context.target.target === "serve-electron") {
            const electronBin = isMac()
                ? "./node_modules/.bin/electron"
                : "node_modules/electron/dist/electron";
            const ls = child_process_1.spawn(electronBin, [
                options.electronMain,
                "-port",
                x.port + ""
            ]);
            ls.stdout.on("data", function (data) {
                context.logger.info(data.toString());
            });
            ls.stderr.on("data", function (data) {
                context.logger.error(data.toString());
            });
            ls.on("exit", function (code) {
                console.log("Exit");
                observer.next({ success: true });
            });
        }
        else {
            observer.next({ success: true });
        }
    });
}
exports.openElectron = openElectron;
exports.default = architect_1.createBuilder(exports.execute);
//# sourceMappingURL=index.js.map