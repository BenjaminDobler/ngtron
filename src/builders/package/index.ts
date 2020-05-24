import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString } from "@angular-devkit/architect";
import { DevServerBuilderOptions, DevServerBuilderOutput } from "@angular-devkit/build-angular";
import { from, Observable } from "rxjs";
import { filter, mapTo, switchMap, tap } from "rxjs/operators";
import { buildElectron } from "../util/electron";
import { electronBuildWebpackConfigTransformFactory } from "../util/util";
import { buildWebpackBrowser } from "@angular-devkit/build-angular/src/browser";
import { copyFileSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { JsonObject } from "@angular-devkit/core";


export interface NGTronPackageOptions extends JsonObject {
  buildTarget: string;
  packagerConfig: any;
}

export const execute = (options: NGTronPackageOptions, context: BuilderContext): Observable<BuilderOutput> => {

  const buildTarget = targetFromTargetString(options.buildTarget);
  return from(context.getTargetOptions(buildTarget)).pipe(
    switchMap(options => context.scheduleTarget(buildTarget, options)),
    switchMap(run => run.output),
    switchMap((x: any) => buildElectron(options.packagerConfig)),
    mapTo({ success: true })
  );

  /*
async function setup() {
  const buildTarget = targetFromTargetString(options.buildTarget);
  const buildOptions = await context.getTargetOptions(buildTarget);

  buildOptions.watch = false;
  buildOptions.baseHref = "./";


  return {
    buildOptions: buildOptions,
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
  mapTo({ success: true })
);
*/
};

export default createBuilder<NGTronPackageOptions, DevServerBuilderOutput>(execute);
