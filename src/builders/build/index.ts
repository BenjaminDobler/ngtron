import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString, scheduleTargetAndForget, BuilderRun } from "@angular-devkit/architect";
import { DevServerBuilderOptions, DevServerBuilderOutput } from "@angular-devkit/build-angular";
import { from, Observable, combineLatest, timer } from "rxjs";
import { mapTo, switchMap, combineAll, tap, timeout } from "rxjs/operators";
import { openElectron } from "../util/electron";
import { compile, electronBuildWebpackConfigTransformFactory } from "../util/util";
import { buildWebpackBrowser } from "@angular-devkit/build-angular/src/browser";
import * as ts from "typescript";
import { basename, join } from "path";
import { copyFileSync, writeFileSync, existsSync, readFileSync } from "fs";
import { build } from "electron-builder";
import { JsonObject, resolve } from "@angular-devkit/core";
import { symlinkSync } from "fs-extra-p";

export interface NGTronBuildOptions extends JsonObject {
  mainTarget: string;
  outputPath: string;
  rendererOutputPath: string;
  rendererTargets: string[];
}

export const execute = (options: NGTronBuildOptions, context: BuilderContext): Observable<BuilderOutput> => {
  console.log("Options ", options);


  async function init() {
    // Add the renderer targets
    const builderRuns$: Observable<BuilderRun>[] = options.rendererTargets.map((target) => {
      const rendererTarget = targetFromTargetString(target);
      const overrides = {
        outputPath: options.rendererOutputPath + '/' + rendererTarget.project,
        watch: true,
        baseHref: "./"
      }
      return from(context.scheduleTarget(rendererTarget, overrides));
    });

    // Add the node js main target
    const mainTarget = targetFromTargetString(options.mainTarget);
    const mainOptions: any = await context.getTargetOptions(mainTarget);
    const mainOverrides = {
      watch: true,
      outputPath: options.outputPath,
      webpackConfigObject: {
        node: {
          __dirname: false
        }
      }
    };
    builderRuns$.push(from(context.scheduleTarget(mainTarget, mainOverrides)));

    const electronBuildNodeModules = join(context.workspaceRoot, options.outputPath, 'node_modules');
    if (!existsSync(electronBuildNodeModules)) {
      const workspaceNodeModules = join(context.workspaceRoot, 'node_modules');
      symlinkSync(workspaceNodeModules, electronBuildNodeModules, 'junction');
    }

    // copy electron package.json
    const electronPkgPath = join(context.workspaceRoot, 'projects', context.target.project, 'package.json');
    const electronPKG = JSON.parse(readFileSync(electronPkgPath, { encoding: 'utf-8' }));
    electronPKG.main = basename(mainOptions.main, '.ts') + '.js';
    const electronPkgDistPath = join(context.workspaceRoot, options.outputPath, 'package.json');
    writeFileSync(electronPkgDistPath, JSON.stringify(electronPKG, null, 4), { encoding: 'utf-8' });

    return builderRuns$;
  }

  return from(init()).pipe(
    switchMap(builderRuns$ => combineLatest(builderRuns$)
      .pipe(
        switchMap(runs => combineLatest(runs.map(run => run.output.pipe(
          tap((builderOutput: BuilderOutput) => {
            console.log("------ Output! ", builderOutput.target.project);
          })
        )))),
        tap((builderOutputs: BuilderOutput[]) => {
          console.log("------- ALL Done");
          openElectron(join(context.workspaceRoot, options.outputPath), context).subscribe();
          context.reportRunning();
        }),
        mapTo({ success: true })
      ))
  );

}



export default createBuilder<NGTronBuildOptions, DevServerBuilderOutput>(execute);
