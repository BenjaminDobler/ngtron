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
import { join } from "@angular-devkit/core";
import { Configuration as WebpackDevServerConfig } from "webpack-dev-server";
import { Configuration } from "webpack";

export const noneElectronWebpackConfigTransformFactory: (
  options: any
) => BrowserConfigTransformFn = options => ({ root }, browserWebpackConfig) => {
  const IGNORES = ["fs", "electron", "path"];

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

export const electronWebpackConfigTransformFactory: (
  options: any
) => BrowserConfigTransformFn = options => ({ root }, browserWebpackConfig) => {
  const IGNORES = ["fs", "electron", "path"];
  browserWebpackConfig.externals = [
    (function() {
      return function(context, request, callback) {
        if (IGNORES.indexOf(request) >= 0) {
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
    return buildOptions;
  }

  return from(setup()).pipe(
    switchMap(browserOptions => {
      const webpackTransformFactory =
        context.target.target === "serve-electron"
          ? electronWebpackConfigTransformFactory
          : noneElectronWebpackConfigTransformFactory;
      return serveWebpackBrowser(
        browserOptions as DevServerBuilderSchema,
        context,
        {
          browserConfig: webpackTransformFactory(browserOptions),
          serverConfig: serverConfigTransformFactory(
            options,
            browserOptions,
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
