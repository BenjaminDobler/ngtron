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
const fs_1 = require("fs");
const path_1 = require("path");
const builder = require("electron-builder");
function execute(options, context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Current Directory ", context.currentDirectory);
        console.log("Options", options);
        const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
        console.log("Browser target ", browserTarget);
        const serverOptions = yield context.getTargetOptions(browserTarget);
        console.log("Serve Options", serverOptions);
        const buildOptions = yield context.getTargetOptions({
            project: browserTarget.project,
            target: "build"
        });
        console.log("build options ", buildOptions);
        const overrides = {
            watch: false,
            baseHref: "./"
        };
        const server = yield context.scheduleTarget(browserTarget, overrides);
        let result;
        try {
            result = yield server.result;
        }
        catch (error) {
            context.reportStatus("Error: " + error);
        }
        // Copy electron main
        const fromMain = path_1.join(context.workspaceRoot, options.electronMain);
        const toMain = path_1.join(result.outputPath, path_1.basename(options.electronMain));
        fs_1.copyFileSync(fromMain, toMain);
        // write electron package to dist
        fs_1.writeFileSync(path_1.join(result.outputPath, "package.json"), JSON.stringify(options.electronPackage), { encoding: "utf-8" });
        // Build!
        try {
            yield builder.build(options.packagerConfig);
        }
        catch (e) {
            console.log("Publish error", e);
        }
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
exports.default = architect_1.createBuilder(execute);
//# sourceMappingURL=index.js.map