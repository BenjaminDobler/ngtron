import { createBuilder, targetFromTargetString, BuilderContext, BuilderOutput } from "@angular-devkit/architect";
import { DevServerBuilderOutput, executeDevServerBuilder, DevServerBuilderOptions } from "@angular-devkit/build-angular";
import { Observable, of, from, pipe } from "rxjs";
import { switchMap, mapTo, filter, tap } from "rxjs/operators";
import { noneElectronWebpackConfigTransformFactory } from "../util/util";

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

    const electronBuildTarget = targetFromTargetString(context.target.project + ":package-electron");

    buildElectronOptions = await context.getTargetOptions(electronBuildTarget);

    return {
      buildOptions: buildOptions,
      buildElectronOptions: buildElectronOptions
    };
  }

  return from(setup()).pipe(
    switchMap(opt => {
      const webpackTransformFactory = noneElectronWebpackConfigTransformFactory;

      return executeDevServerBuilder(opt.buildOptions as DevServerBuilderOptions, context, {
        webpackConfiguration: webpackTransformFactory(opt.buildOptions, opt.buildElectronOptions, context)
      });
    }),
    filter((val, index) => index < 1),
    tap((x: DevServerBuilderOutput) => console.log(x)),
    mapTo({ success: true })
  );
};

export default createBuilder<DevServerBuilderOptions, DevServerBuilderOutput>(execute);
