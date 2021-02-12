import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString, BuilderRun } from '@angular-devkit/architect';
import { DevServerBuilderOutput } from '@angular-devkit/build-angular';
import { from, Observable, combineLatest } from 'rxjs';
import { mapTo, switchMap, tap } from 'rxjs/operators';
import { openElectron } from '../util/electron';
import { basename, join } from 'path';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { JsonObject } from '@angular-devkit/core';
import { symlinkSync, removeSync, ensureDirSync } from 'fs-extra';
import { DevServer } from '../util/dev.server/dev.server';
const InjectPlugin = require('webpack-inject-plugin').default;
import { getExternals } from '../util/externals';
import * as findFreePort from 'find-free-port';

export interface NGTronBuildOptions extends JsonObject {
    mainTarget: string;
    outputPath: string;
    rendererOutputPath: string;
    rendererTargets: string[];
    watch: boolean;
    serve: boolean;
    package: string;
    devServerPort: number;
}

export const execute = (options: NGTronBuildOptions, context: BuilderContext): Observable<BuilderOutput> => {
    let devServer: DevServer;
    const electronPkgPath = join(context.workspaceRoot, options.package);
    const mainTarget = targetFromTargetString(options.mainTarget);
    let mainOptions: any;

    async function init() {
        removeSync(join(context.workspaceRoot, options.outputPath));
        ensureDirSync(join(context.workspaceRoot, options.outputPath));

        const electronPkgString = readFileSync(electronPkgPath, { encoding: 'utf-8' });
        const electronPkg = JSON.parse(electronPkgString);

        const externals = getExternals(electronPkg.dependencies || {});

        // Add the renderer targets
        const builderRuns$: Observable<BuilderRun>[] = options.rendererTargets.map((target) => {
            const rendererTarget = targetFromTargetString(target);
            const overrides = {
                outputPath: options.rendererOutputPath + '/' + rendererTarget.project,
                watch: options.watch,
                baseHref: './',
                aot: false,
                optimization: false,
                webpackConfig: {
                    externals: externals,
                },
            };
            return from(context.scheduleTarget(rendererTarget, overrides));
        });

        const mainWebpackConfig: any = {
            mode: 'development',
            node: {
                __dirname: false,
            },
            externals: {
                electron: 'commonjs electron',
                ws: 'commonjs ws',
            },
        };

        if (options.serve && options.watch) {
            const freePorts = await findFreePort(options.devServerPort);
            devServer = new DevServer(freePorts[0]);
            mainWebpackConfig.plugins = [
                new InjectPlugin(function () {
                    return devServer.getInject();
                }),
            ];
        }

        // Add the node js main target
        mainOptions = await context.getTargetOptions(mainTarget);
        const mainOverrides: any = {
            watch: options.watch,
            outputPath: options.outputPath,
            webpackConfigObject: mainWebpackConfig,
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

        return builderRuns$;
    }

    let allBuildOnce = false;
    return from(init()).pipe(
        switchMap((builderRuns$) =>
            combineLatest(builderRuns$).pipe(
                switchMap((runs) =>
                    combineLatest(
                        runs.map((run) => {
                            if (options.serve) {
                                return run.output.pipe(
                                    tap((builderOutput: BuilderOutput) => {
                                        if (builderOutput.info.name.startsWith('@richapps/ngnode') && options.serve) {
                                            if (allBuildOnce) {
                                                openElectron(join(context.workspaceRoot, options.outputPath), context).subscribe();
                                            }
                                        } else {
                                            if (devServer) {
                                                devServer.sendUpdate({ type: 'renderer', info: builderOutput });
                                            }
                                        }
                                    })
                                );
                            } else {
                                return from(run.result);
                            }
                        })
                    )
                ),
                tap(() => {
                    if (!allBuildOnce) {
                        // copy electron package.json
                        const electronPKG = JSON.parse(readFileSync(electronPkgPath, { encoding: 'utf-8' }));
                        const main = Array.isArray(mainOptions.main) ? mainOptions.main[0] : mainOptions.main;
                        electronPKG.main = basename(main, '.ts') + '.js';
                        const electronPkgDistPath = join(context.workspaceRoot, options.outputPath, 'package.json');
                        writeFileSync(electronPkgDistPath, JSON.stringify(electronPKG, null, 4), { encoding: 'utf-8' });

                        openElectron(join(context.workspaceRoot, options.outputPath), context).subscribe();
                        allBuildOnce = true;
                    }
                    if (options.watch) {
                        context.reportRunning();
                    }
                }),
                mapTo({ success: true })
            )
        )
    );
};


export default createBuilder<NGTronBuildOptions, DevServerBuilderOutput>(execute);
