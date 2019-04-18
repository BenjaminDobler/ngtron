import {
  createBuilder,
  targetFromTargetString,
  BuilderContext,
  BuilderOutput
} from "@angular-devkit/architect";
import {
  DevServerBuilderOutput,
  DevServerBuilderSchema,
  serveWebpackBrowser,
  BrowserConfigTransformFn,
  buildServerConfig
} from "@angular-devkit/build-angular";
import { Observable, of, from, pipe } from "rxjs";

import {
  switchMap,
  tap,
  concatMap,
  mapTo,
  first,
  take,
  filter
} from "rxjs/operators";
import { spawn, ChildProcess } from "child_process";
import { Configuration as WebpackDevServerConfig } from "webpack-dev-server";
import { Configuration } from "webpack";
import { join } from "path";
import { BUILD_IN_ELECTRON_MODULES, BUILD_IN_NODE_MODULES } from "../util/util";

export const noneElectronWebpackConfigTransformFactory = (
  options: any,
  buildElectronOptions: any,
  context: BuilderContext
) => ({ root }, browserWebpackConfig) => {
  const externalDependencies =
    buildElectronOptions.electronPackage.dependencies;
  const rootNodeModules = join(context.workspaceRoot, "node_modules");
  let IGNORES = Object.keys(externalDependencies);
  IGNORES = [
    ...IGNORES,
    ...BUILD_IN_ELECTRON_MODULES,
    ...BUILD_IN_NODE_MODULES
  ];
  browserWebpackConfig.externals = [
    (function() {
      return function(context, request, callback) {
        if (IGNORES.indexOf(request) >= 0) {
          return callback(null, "'undefined'");
        }
        return callback();
      };
    })()
  ];

  return of(browserWebpackConfig);
};

export const electronWebpackConfigTransformFactory: any = (
  options: any,
  buildElectronOptions: any,
  context: BuilderContext
) => ({ root }, browserWebpackConfig) => {
  const externalDependencies =
    buildElectronOptions.electronPackage.dependencies;
  const rootNodeModules = join(context.workspaceRoot, "node_modules");
  let IGNORES = Object.keys(externalDependencies);
  IGNORES = [
    ...IGNORES,
    ...BUILD_IN_ELECTRON_MODULES,
    ...BUILD_IN_NODE_MODULES
  ];

  browserWebpackConfig.externals = [
    (function() {
      return function(context, request, callback) {
        if (IGNORES.indexOf(request) >= 0) {
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

  browserWebpackConfig.target = "electron-renderer";

  return of(browserWebpackConfig);
};

export const serverConfigTransformFactory: any = (
  options,
  browserOptions,
  context
) => ({ root }, config: Configuration): Observable<WebpackDevServerConfig> => {
  const originalConfig = buildServerConfig(
    root,
    options,
    browserOptions,
    context.logger
  );
  return of(originalConfig);
};

export const execute = (
  options: DevServerBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> => {
  let serverOptions;
  let buildElectronOptions;

  async function setup() {
    const browserTarget = targetFromTargetString(options.browserTarget);
    serverOptions = await context.getTargetOptions(browserTarget);
    const buildOptions = await context.getTargetOptions({
      project: context.target.project,
      target: "build"
    });
    buildOptions.browserTarget = context.target.project + ":build";
    buildOptions.port = options.port ? options.port : 4200;
    buildOptions.watch = true;

    const electronBuildTarget = targetFromTargetString(
      context.target.project + ":build-electron"
    );

    buildElectronOptions = await context.getTargetOptions(electronBuildTarget);

    return {
      buildOptions: buildOptions,
      buildElectronOptions: buildElectronOptions
    };
  }

  return from(setup()).pipe(
    switchMap(opt => {
      const webpackTransformFactory =
        context.target.target === "serve-electron"
          ? electronWebpackConfigTransformFactory
          : noneElectronWebpackConfigTransformFactory;
      return serveWebpackBrowser(
        opt.buildOptions as DevServerBuilderSchema,
        context,
        {
          browserConfig: webpackTransformFactory(
            opt.buildOptions,
            opt.buildElectronOptions,
            context
          ),
          serverConfig: serverConfigTransformFactory(
            options,
            opt.buildOptions,
            context
          )
        }
      );
    }),
    filter((val, index) => index < 1),
    switchMap((x: DevServerBuilderOutput) => openElectron(x, options, context)),
    mapTo({ success: true })
  );
};

function isMac() {
  return /^darwin/.test(process.platform);
}

export function openElectron(
  x: DevServerBuilderOutput,
  options: any,
  context: BuilderContext
): Observable<BuilderOutput> {
  return new Observable(observer => {
    console.log("Open Electron ", x.port);
    if (context.target.target === "serve-electron") {
      const electronBin = isMac()
        ? "./node_modules/.bin/electron"
        : "node_modules/electron/dist/electron";

      const ls: ChildProcess = spawn(electronBin, [
        options.electronMain,
        "-port",
        x.port + ""
      ]);
      ls.stdout.on("data", function(data) {
        context.logger.info(data.toString());
      });

      ls.stderr.on("data", function(data) {
        context.logger.error(data.toString());
      });

      ls.on("exit", function(code) {
        console.log("Exit");
        observer.next({ success: true });
      });
    } else {
      observer.next({ success: true });
    }
  });
}

export default createBuilder<DevServerBuilderSchema, DevServerBuilderOutput>(
  execute
);
