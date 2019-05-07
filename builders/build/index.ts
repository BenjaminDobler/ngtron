import {BuilderContext, BuilderOutput, createBuilder, targetFromTargetString} from "@angular-devkit/architect";
import {DevServerBuilderOptions, DevServerBuilderOutput} from "@angular-devkit/build-angular";
import {from, Observable} from "rxjs";
import {mapTo, switchMap} from "rxjs/operators";
import {openElectron, reloadElectron} from "../util/electron";
import {compile, electronBuildWebpackConfigTransformFactory} from "../util/util";
import {buildWebpackBrowser} from "@angular-devkit/build-angular/src/browser";
import * as ts from "typescript";
import {basename, join} from "path";
import {copyFileSync, writeFileSync} from "fs";
import {build} from "electron-builder";


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

    compile([options.electronMain as string], {
      noEmitOnError: true,
      noImplicitAny: true,
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS,
      outDir: buildOptions.outputPath as string
    });

    const outputPath = buildOptions.outputPath as string;


    const electronBuildTarget = targetFromTargetString(context.target.project + ":package-electron");
    buildElectronOptions = await context.getTargetOptions(electronBuildTarget);

    const fromMain = join(context.workspaceRoot, options.electronMain as string);
    const toMain = join(outputPath, basename(options.electronMain as string));
    copyFileSync(fromMain, toMain);

    // write electron package to dist
    writeFileSync(join(outputPath, "package.json"), JSON.stringify(buildElectronOptions.electronPackage), {encoding: "utf-8"});


    return {
      buildOptions: buildOptions,
      buildElectronOptions: buildElectronOptions
    };
  }


  let count = -1;

  return from(setup()).pipe(
    switchMap(opt => {
      return buildWebpackBrowser(opt.buildOptions as any, context, {
        webpackConfiguration: electronBuildWebpackConfigTransformFactory(opt.buildOptions, opt.buildElectronOptions, context)
      });
    }),
    switchMap((x: any) => {
      count++;
      if (count < 1) {
        return openElectron(x, join(x.outputPath, "electron.js"), context)
      } else {
        return reloadElectron(x, context);
      }
    }),
    mapTo({success: true})
  );
};

export default createBuilder<DevServerBuilderOptions, DevServerBuilderOutput>(execute);
