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
const util_1 = require("../util/util");
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
            const electronBuildTarget = architect_1.targetFromTargetString(context.target.project + ":package-electron");
            buildElectronOptions = yield context.getTargetOptions(electronBuildTarget);
            return {
                buildOptions: buildOptions,
                buildElectronOptions: buildElectronOptions
            };
        });
    }
    return rxjs_1.from(setup()).pipe(operators_1.switchMap(opt => {
        const webpackTransformFactory = util_1.noneElectronWebpackConfigTransformFactory;
        return build_angular_1.executeDevServerBuilder(opt.buildOptions, context, {
            webpackConfiguration: webpackTransformFactory(opt.buildOptions, opt.buildElectronOptions, context)
        });
    }), operators_1.filter((val, index) => index < 1), operators_1.tap((x) => console.log(x)), operators_1.mapTo({ success: true }));
};
exports.default = architect_1.createBuilder(exports.execute);
//# sourceMappingURL=index.js.map