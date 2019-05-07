"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const child_process_1 = require("child_process");
const util_1 = require("./util");
const builder = require("electron-builder");
function openElectron(x, electronMain, context) {
    return new rxjs_1.Observable(observer => {
        if (context.target.target === "build-electron") {
            const electronBin = util_1.isMac() ? "./node_modules/.bin/electron" : "node_modules/electron/dist/electron";
            const ls = child_process_1.spawn(electronBin, [electronMain]);
            ls.stdout.on("data", function (data) {
                context.logger.info(data.toString());
            });
            ls.stderr.on("data", function (data) {
                context.logger.error(data.toString());
            });
            ls.on("exit", function (code) {
                observer.next({ success: true });
                observer.complete();
            });
        }
        else {
            observer.next({ success: true });
            observer.complete();
        }
    });
}
exports.openElectron = openElectron;
function reloadElectron(x, context) {
    return new rxjs_1.Observable(observer => {
        console.log("Reload Electron ");
        observer.next({ success: true });
    });
}
exports.reloadElectron = reloadElectron;
function buildElectron(config) {
    return new rxjs_1.Observable(observer => {
        builder.build(config).then(() => {
            observer.next({ success: true });
            observer.complete();
        }, e => {
            console.log("Error ", e);
            observer.error();
        });
    });
}
exports.buildElectron = buildElectron;
//# sourceMappingURL=electron.js.map