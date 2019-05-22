import {join} from "path";
import {BuilderContext} from "@angular-devkit/architect";

export const BUILD_IN_NODE_MODULES = ["fs", "path"]; // TODO: add all build in node modules
export const BUILD_IN_ELECTRON_MODULES = ["electron", "app", "shell"]; // TODO: add all build in electron modules

export function isMac() {
  return /^darwin/.test(process.platform);
}


export const noneElectronWebpackConfigTransformFactory: any = (options: any, buildElectronOptions: any, context: BuilderContext) => {
  context.logger.info("Electron Browser Serve Webpack");
  return webpackConfig => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    let EXTERNALS = Object.keys(externalDependencies);
    EXTERNALS = [...EXTERNALS, ...BUILD_IN_ELECTRON_MODULES, ...BUILD_IN_NODE_MODULES];
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


export const electronServeWebpackConfigTransformFactory: any = (options: any, buildElectronOptions: any, context: BuilderContext) => {
  context.logger.info("Electron Serve Webpack");
  return webpackConfig => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    const rootNodeModules = join(context.workspaceRoot, "node_modules");
    let EXTERNALS = Object.keys(externalDependencies);
    EXTERNALS = [...EXTERNALS, ...BUILD_IN_ELECTRON_MODULES, ...BUILD_IN_NODE_MODULES];

    webpackConfig.externals = [
      (function () {
        return function (context, request, callback) {
          console.log("Request ", request);
          if (EXTERNALS.indexOf(request) >= 0) {
            if (externalDependencies.hasOwnProperty(request)) {
              const modulePath = join(rootNodeModules, request);
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
export const electronBuildWebpackConfigTransformFactory: any = (options: any, buildElectronOptions: any, context: BuilderContext) => {
  return webpackConfig => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    let EXTERNALS = Object.keys(externalDependencies);
    EXTERNALS = [...EXTERNALS, ...BUILD_IN_ELECTRON_MODULES, ...BUILD_IN_NODE_MODULES];

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


import * as ts from "typescript";

export function compile(fileNames: string[], options: ts.CompilerOptions): void {
  let program = ts.createProgram(fileNames, options);
  let emitResult = program.emit();

  let allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      let message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
      );
    }
  });

  let exitCode = emitResult.emitSkipped ? 1 : 0;
}
