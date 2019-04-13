import { BuilderContext } from "@angular-devkit/architect";
import { DevServerBuilderOutput, DevServerBuilderSchema } from "@angular-devkit/build-angular";
import { Observable } from "rxjs";
export declare const serveCustomWebpackBrowser: (options: DevServerBuilderSchema, context: BuilderContext) => Observable<DevServerBuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<DevServerBuilderSchema>;
export default _default;
