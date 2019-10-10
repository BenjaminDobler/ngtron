import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString } from "@angular-devkit/architect";
import { DevServerBuilderOptions, DevServerBuilderOutput, executeDevServerBuilder } from "@angular-devkit/build-angular";
import { from, Observable } from "rxjs";
import { filter, mapTo, switchMap, tap } from "rxjs/operators";
import { noneElectronWebpackConfigTransformFactory } from "../util/util";
import { JsonObject } from "@angular-devkit/core";


export interface NGTronServeOptions extends JsonObject {
  buildTarget: string;
}

export const execute = (options: NGTronServeOptions, context: BuilderContext): Observable<BuilderOutput> => {
  const buildTarget = targetFromTargetString(options.buildTarget);
  return from(context.getTargetOptions(buildTarget)).pipe(
    switchMap(options => context.scheduleTarget(buildTarget, { ...options, watch: true, serve: true })),
    switchMap(run => run.progress),
    mapTo({ success: true })
  );
};

export default createBuilder<NGTronServeOptions, DevServerBuilderOutput>(execute);
