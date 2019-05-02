import { createBuilder, targetFromTargetString, BuilderContext, BuilderOutput } from "@angular-devkit/architect";
import { DevServerBuilderOutput, executeDevServerBuilder, DevServerBuilderOptions } from "@angular-devkit/build-angular";
import { Observable, of, from, pipe } from "rxjs";
import { switchMap, mapTo, filter } from "rxjs/operators";
import { openElectron } from "../electron/electron";
import {
  noneElectronWebpackConfigTransformFactory,
  electronServeWebpackConfigTransformFactory,
  electronBuildWebpackConfigTransformFactory, compile
} from "../util/util";
import {buildWebpackBrowser} from "@angular-devkit/build-angular/src/browser";
import * as ts from "typescript";


export const execute = (options: DevServerBuilderOptions, context: BuilderContext): Observable<BuilderOutput> => {
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
    buildOptions.baseHref = "./";


    const electronBuildTarget = targetFromTargetString(context.target.project + ":build-electron");

    buildElectronOptions = await context.getTargetOptions(electronBuildTarget);

    return {
      buildOptions: buildOptions,
      buildElectronOptions: buildElectronOptions
    };
  }

  compile([options.electronMain as string], {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.CommonJS,
    outDir: "./dist/ngtube/",

  })

  return from(setup()).pipe(
    switchMap(opt => {
      const webpackTransformFactory = context.target.target === "serve-electron" ? electronServeWebpackConfigTransformFactory : noneElectronWebpackConfigTransformFactory;

      return buildWebpackBrowser(opt.buildOptions as any, context, {
        webpackConfiguration: electronBuildWebpackConfigTransformFactory(opt.buildOptions, opt.buildElectronOptions, context)
      });
    }),
    filter((val, index) => index < 1),
    switchMap((x: any) => openElectron(x, "./dist/ngtube/electron.js", context)),
    mapTo({ success: true })
  );
};

export default createBuilder<DevServerBuilderOptions, DevServerBuilderOutput>(execute);
