import { BuilderContext, BuilderOutput } from "@angular-devkit/architect";
import { DevServerBuilderOutput, DevServerBuilderOptions } from "@angular-devkit/build-angular";
import { Observable } from "rxjs";
export declare const noneElectronWebpackConfigTransformFactory: (options: any, buildElectronOptions: any, context: BuilderContext) => ({ root }: {
    root: any;
}, browserWebpackConfig: any) => Observable<any>;
export declare const electronWebpackConfigTransformFactory: any;
export declare const execute: (options: DevServerBuilderOptions, context: BuilderContext) => Observable<BuilderOutput>;
export declare function openElectron(x: DevServerBuilderOutput, options: any, context: BuilderContext): Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<DevServerBuilderOptions>;
export default _default;
