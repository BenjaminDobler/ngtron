import {BuilderContext, BuilderOutput, createBuilder, targetFromTargetString} from "@angular-devkit/architect";
import {DevServerBuilderOptions, DevServerBuilderOutput} from "@angular-devkit/build-angular";
import {from, Observable} from "rxjs";
import {filter, mapTo, switchMap, tap} from "rxjs/operators";
import {buildElectron} from "../util/electron";
import {electronBuildWebpackConfigTransformFactory} from "../util/util";
import {buildWebpackBrowser} from "@angular-devkit/build-angular/src/browser";
import {copyFileSync, writeFileSync} from "fs";
import {basename, join} from "path";

export const execute = (options: DevServerBuilderOptions, context: BuilderContext): Observable<BuilderOutput> => {
  let serverOptions;
  let buildElectronOptions;

  async function setup() {
    const browserTarget = targetFromTargetString(options.browserTarget);
    serverOptions = await context.getTargetOptions(browserTarget);
    const buildOptions = await context.getTargetOptions({
      project: context.target.project,
      configuration: context.target.configuration,
      target: "build"
    });
    buildOptions.browserTarget = context.target.project + ":package-electron";
    buildOptions.port = options.port ? options.port : 4200;
    buildOptions.watch = false;
    buildOptions.baseHref = "./";

    const electronBuildTarget = targetFromTargetString(context.target.project + ":package-electron");

    buildElectronOptions = await context.getTargetOptions(electronBuildTarget);

    return {
      buildOptions: buildOptions,
      buildElectronOptions: buildElectronOptions
    };
  }

  return from(setup()).pipe(
    switchMap(opt => {
      return buildWebpackBrowser(opt.buildOptions as any, context, {
        webpackConfiguration: electronBuildWebpackConfigTransformFactory(opt.buildOptions, opt.buildElectronOptions, context)
      });
    }),
    filter((val, index) => index < 1),
    tap(result => {
      // Copy electron main
      const fromMain = join(context.workspaceRoot, options.electronMain as string);
      const toMain = join(result.outputPath, basename(options.electronMain as string));
      copyFileSync(fromMain, toMain);

      // write electron package to dist
      writeFileSync(join(result.outputPath, "package.json"), JSON.stringify(options.electronPackage), { encoding: "utf-8" });
    }),
    switchMap((x: any) => buildElectron(options.packagerConfig)),
    mapTo({ success: true})
  );
};

export default createBuilder<DevServerBuilderOptions, DevServerBuilderOutput>(execute);
