import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString, BuilderRun } from "@angular-devkit/architect";
import { DevServerBuilderOutput } from "@angular-devkit/build-angular";
import { from, Observable, combineLatest } from "rxjs";
import { mapTo, switchMap, tap } from "rxjs/operators";
import { openElectron } from "../util/electron";
import { basename, join } from "path";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { JsonObject } from "@angular-devkit/core";
import { symlinkSync, removeSync, ensureDirSync } from "fs-extra-p";
import { DevServer } from "../util/dev.server";
const InjectPlugin = require('webpack-inject-plugin').default;
import { getExternals } from '../util/externals';


export interface NGTronBuildOptions extends JsonObject {
  mainTarget: string;
  outputPath: string;
  rendererOutputPath: string;
  rendererTargets: string[];
  devServerPort: number;
  watch: boolean;
  serve: boolean;
}

export const execute = (options: NGTronBuildOptions, context: BuilderContext): Observable<BuilderOutput> => {
  let devServer: DevServer;

  async function init() {

    removeSync(join(context.workspaceRoot, options.outputPath));
    ensureDirSync(join(context.workspaceRoot, options.outputPath));

    const electronPkgPath = join(context.workspaceRoot, 'projects', context.target.project, 'package.json');
    const electronPkgString = readFileSync(electronPkgPath, { encoding: 'utf-8' });
    const electronPkg = JSON.parse(electronPkgString);

    const externals = getExternals(electronPkg.dependencies || {});

    // Add the renderer targets
    const builderRuns$: Observable<BuilderRun>[] = options.rendererTargets.map((target) => {
      const rendererTarget = targetFromTargetString(target);
      const overrides = {
        outputPath: options.rendererOutputPath + '/' + rendererTarget.project,
        watch: options.watch,
        baseHref: "./",
        aot: false,
        optimization: false,
        webpackConfig: {
          externals: externals
        }
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

    if (options.serve && options.watch) {
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
    if (options.serve) {
      const electronBuildNodeModules = join(context.workspaceRoot, options.outputPath, 'node_modules');
      if (!existsSync(electronBuildNodeModules)) {
        const workspaceNodeModules = join(context.workspaceRoot, 'node_modules');
        symlinkSync(workspaceNodeModules, electronBuildNodeModules, 'junction');
      }
    }

    // copy electron package.json
    const electronPKG = JSON.parse(readFileSync(electronPkgPath, { encoding: 'utf-8' }));
    electronPKG.main = basename(mainOptions.main, '.ts') + '.js';
    const electronPkgDistPath = join(context.workspaceRoot, options.outputPath, 'package.json');
    writeFileSync(electronPkgDistPath, JSON.stringify(electronPKG, null, 4), { encoding: 'utf-8' });

    return builderRuns$;
  }

  return from(init()).pipe(
    switchMap(builderRuns$ => combineLatest(builderRuns$)
      .pipe(
        switchMap(runs => combineLatest(runs.map(run => {

          if (options.serve) {
            return run.output.pipe(
              tap((builderOutput: BuilderOutput) => {
                if (builderOutput.info.name.startsWith('@richapps/ngnode') && options.serve) {
                  openElectron(join(context.workspaceRoot, options.outputPath), context).subscribe();
                } else {
                  if (devServer) {
                    devServer.sendUpdate({ type: 'renderer', info: builderOutput });
                  }
                }
              })
            )
          } else {
            return from(run.result);
          }
        })
        )),
        tap(() => {
          if (options.watch) {
            context.reportRunning();
          }
        }),
        mapTo({ success: true })
      ))
  );

}

export default createBuilder<NGTronBuildOptions, DevServerBuilderOutput>(execute);
