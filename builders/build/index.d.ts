import { BuilderContext, BuilderOutput } from "@angular-devkit/architect";
import { DevServerBuilderOptions } from "@angular-devkit/build-angular";
import { Observable } from "rxjs";
export declare const execute: (options: DevServerBuilderOptions, context: BuilderContext) => Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<DevServerBuilderOptions>;
export default _default;
