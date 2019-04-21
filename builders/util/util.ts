import { join } from "path";
import { BuilderContext } from "@angular-devkit/architect";
import { of } from "rxjs";

export const BUILD_IN_NODE_MODULES = ["fs", "path"];
export const BUILD_IN_ELECTRON_MODULES = ["electron", "app", "shell"];

export function isMac() {
  return /^darwin/.test(process.platform);
}

export const noneElectronWebpackConfigTransformFactory = (options: any, buildElectronOptions: any, context: BuilderContext) => ({ root }, browserWebpackConfig) => {
  const externalDependencies = buildElectronOptions.electronPackage.dependencies;
  let EXTERNALS = Object.keys(externalDependencies);
  EXTERNALS = [...EXTERNALS, ...BUILD_IN_ELECTRON_MODULES, ...BUILD_IN_NODE_MODULES];
  browserWebpackConfig.externals = [
    (function() {
      return function(context, request, callback) {
        if (EXTERNALS.indexOf(request) >= 0) {
          return callback(null, "'undefined'");
        }
        return callback();
      };
    })()
  ];

  return of(browserWebpackConfig);
};

export const electronServeWebpackConfigTransformFactory: any = (options: any, buildElectronOptions: any, context: BuilderContext) => {
  return webpackConfig => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    const rootNodeModules = join(context.workspaceRoot, "node_modules");
    let EXTERNALS = Object.keys(externalDependencies);
    EXTERNALS = [...EXTERNALS, ...BUILD_IN_ELECTRON_MODULES, ...BUILD_IN_NODE_MODULES];

    webpackConfig.externals = [
      (function() {
        return function(context, request, callback) {
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

export const electronBuildWebpackConfigTransformFactory: any = (options: any, buildElectronOptions: any, context: BuilderContext) => {
  return webpackConfig => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    let EXTERNALS = Object.keys(externalDependencies);
    EXTERNALS = [...EXTERNALS, ...BUILD_IN_ELECTRON_MODULES, ...BUILD_IN_NODE_MODULES];

    webpackConfig.externals = [
      (function() {
        return function(context, request, callback) {
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
