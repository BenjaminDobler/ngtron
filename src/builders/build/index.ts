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
import { DevServer } from "../util/dev.server";
const InjectPlugin = require('webpack-inject-plugin').default;

export interface NGTronBuildOptions extends JsonObject {
  mainTarget: string;
  outputPath: string;
  rendererOutputPath: string;
  rendererTargets: string[];
  devServerPort: number;
  watch: boolean;
}

export const execute = (options: NGTronBuildOptions, context: BuilderContext): Observable<BuilderOutput> => {
  console.log("Options ", options);
  let devServer: DevServer;


  async function init() {
    // Add the renderer targets
    const builderRuns$: Observable<BuilderRun>[] = options.rendererTargets.map((target) => {
      const rendererTarget = targetFromTargetString(target);
      const overrides = {
        outputPath: options.rendererOutputPath + '/' + rendererTarget.project,
        watch: true,
        baseHref: "./",
        aot: false,
        optimization: false
      }
      return from(context.scheduleTarget(rendererTarget, overrides));
    });


    const mainWebpackConfig: any = {
      mode: "development",
      node: {
        __dirname: false
      },
      externals: {
        electron: 'commonjs electron',
        ws: 'commonjs ws'
      }
    };

    if (options.watch) {
      devServer = new DevServer(options.devServerPort || 6001);
      mainWebpackConfig.plugins = [
        new InjectPlugin(function () {
          return devServer.getInject();
        })
      ]
    }

    // Add the node js main target
    const mainTarget = targetFromTargetString(options.mainTarget);
    const mainOptions: any = await context.getTargetOptions(mainTarget);
    const mainOverrides: any = {
      watch: true,
      outputPath: options.outputPath,
      webpackConfigObject: mainWebpackConfig
    };
    builderRuns$.push(from(context.scheduleTarget(mainTarget, mainOverrides)));

    // Symlink node modules for dev mode
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
            console.log("------ Output! ", builderOutput);
            if (builderOutput.info.name.startsWith('@richapps/ngnode')) {
              console.log("Background build ");
              openElectron(join(context.workspaceRoot, options.outputPath), context).subscribe();
            } else {
              if (devServer) {
                devServer.sendUpdate({ type: 'renderer', info: builderOutput });
              }
              console.log("Foreground build");
            }
          })
        )))),
        tap((builderOutputs: BuilderOutput[]) => {
          console.log("------- ALL Done");
          context.reportRunning();
        }),
        mapTo({ success: true })
      ))
  );

}



export default createBuilder<NGTronBuildOptions, DevServerBuilderOutput>(execute);
