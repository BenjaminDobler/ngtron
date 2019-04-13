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
exports.serveCustomWebpackBrowser = (options, context) => {
    function setup() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Setup");
            const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
            console.log("Browser target ", browserTarget);
            const serverOptions = yield context.getTargetOptions(browserTarget);
            console.log("Target Options", serverOptions);
            const overrides = {
                watch: false
            };
            const server = yield context.scheduleTarget(browserTarget, overrides);
            let result;
            try {
                result = yield server.result;
                console.log("Result ", result);
                console.log("Port ", result.port);
            }
            catch (error) {
                context.reportStatus("Error: " + error);
            }
            return context.getTargetOptions(browserTarget);
        });
    }
    return rxjs_1.from(setup()).pipe(operators_1.switchMap(browserOptions => build_angular_1.serveWebpackBrowser(options, context)), operators_1.tap(x => console.log(x)));
};
function execute(options, context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Current Directory ", context.currentDirectory);
        console.log("Options", options);
        const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
        console.log("Browser target ", browserTarget);
        const serverOptions = yield context.getTargetOptions(browserTarget);
        console.log("Serve Options", serverOptions);
        const buildOptions = yield context.getTargetOptions({
            project: "app1",
            target: "build"
        });
        console.log("build options ", buildOptions);
        const overrides = {
            watch: false
        };
        if (options.port !== undefined) {
            overrides.port = options.port;
        }
        const server = yield context.scheduleTarget(browserTarget, overrides);
        let result;
        try {
            result = yield server.result;
            console.log("Result ", result);
            console.log("Port ", result.port);
        }
        catch (error) {
            context.reportStatus("Error: " + error);
        }
        // await wait(10000);
        yield openElectron(options.electronMain, result.port);
        return {
            success: true
        };
    });
}
function wait(time) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    });
}
function isMac() {
    return /^darwin/.test(process.platform);
}
function openElectron(electronMain, port) {
    const electronBin = isMac()
        ? "./node_modules/.bin/electron"
        : "node_modules/electron/dist/electron";
    return new Promise((resolve, reject) => {
        const ls = child_process_1.spawn(electronBin, [
            electronMain,
            "-port",
            port + ""
        ]);
        ls.stdout.on("data", function (data) {
            // Logger.info("ELECTRON WATCH (stdout): " + data.toString());
        });
        ls.stderr.on("data", function (data) {
            // Logger.error("ELECTRON WATCH (stderr): " + data.toString());
        });
        ls.on("exit", function (code) {
            // Logger.info("ELECTRON WATCH (exit): " + code.toString());
            // reject(0);
            resolve();
        });
    });
}
exports.default = architect_1.createBuilder(execute);
/*
export default createBuilder<DevServerBuilderSchema, DevServerBuilderOutput>(
  serveCustomWebpackBrowser
);
*/
//# sourceMappingURL=index.1.js.map