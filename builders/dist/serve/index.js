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
exports.noneElectronWebpackConfigTransformFactory = options => ({ root }, browserWebpackConfig) => {
    const IGNORES = ["fs", "electron", "path"];
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
exports.electronWebpackConfigTransformFactory = options => ({ root }, browserWebpackConfig) => {
    const IGNORES = ["fs", "electron", "path"];
    browserWebpackConfig.externals = [
        (function () {
            return function (context, request, callback) {
                if (IGNORES.indexOf(request) >= 0) {
                    return callback(null, "require('" + request + "')");
                }
                return callback();
            };
        })()
    ];
    return rxjs_1.of(browserWebpackConfig);
};
exports.serverConfigTransformFactory = (options, browserOptions, context) => ({ root }, config) => {
    const originalConfig = build_angular_1.buildServerConfig(root, options, browserOptions, context.logger);
    //const {devServer} = mergeConfigs(config, {devServer: originalConfig});
    return rxjs_1.of(originalConfig);
};
exports.execute = (options, context) => {
    let serverOptions;
    function setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
            serverOptions = yield context.getTargetOptions(browserTarget);
            const buildOptions = yield context.getTargetOptions({
                project: context.target.project,
                target: "build"
            });
            buildOptions.browserTarget = "app1:build";
            buildOptions.port = 4200;
            return buildOptions;
            // return context.getTargetOptions(browserTarget) as unknown;
        });
    }
    return rxjs_1.from(setup()).pipe(operators_1.switchMap(browserOptions => {
        const webpackTransformFactory = context.target.target === "serve-electron"
            ? exports.electronWebpackConfigTransformFactory
            : exports.noneElectronWebpackConfigTransformFactory;
        return build_angular_1.serveWebpackBrowser(browserOptions, context, {
            browserConfig: webpackTransformFactory(browserOptions),
            serverConfig: exports.serverConfigTransformFactory(options, browserOptions, context)
        });
    }), operators_1.switchMap((x) => openElectron(x, options, context)), operators_1.mapTo({ success: true }));
};
function isMac() {
    return /^darwin/.test(process.platform);
}
function openElectron(x, options, context) {
    return new rxjs_1.Observable(observer => {
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
                // Logger.info("ELECTRON WATCH (stdout): " + data.toString());
                context.logger.info(data.toString());
            });
            ls.stderr.on("data", function (data) {
                // Logger.error("ELECTRON WATCH (stderr): " + data.toString());
                context.logger.error(data.toString());
            });
            ls.on("exit", function (code) {
                // Logger.info("ELECTRON WATCH (exit): " + code.toString());
                // reject(0);
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
