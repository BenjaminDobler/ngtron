import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import { DevServerBuilderOutput } from '@angular-devkit/build-angular';
import { from, Observable } from 'rxjs';
import { mapTo, switchMap, tap } from 'rxjs/operators';
import { JsonObject } from '@angular-devkit/core';

export interface NGTronServeOptions extends JsonObject {
    buildTarget: string;
}

export const execute = (options: NGTronServeOptions, context: BuilderContext): Observable<BuilderOutput> => {
    const buildTarget = targetFromTargetString(options.buildTarget);
    return from(context.getTargetOptions(buildTarget)).pipe(
        switchMap((options) => {
            return context.scheduleTarget(buildTarget, {
                ...options,
                watch: true,
                serve: true,
            });
        }),
        switchMap((run) => run.progress),
        mapTo({ success: true })
    );
};

export default createBuilder<NGTronServeOptions, DevServerBuilderOutput>(execute);
