import { BuilderContext, BuilderOutput } from "@angular-devkit/architect";
import { DevServerBuilderOutput, DevServerBuilderSchema } from "@angular-devkit/build-angular";
import { Observable } from "rxjs";
export declare const noneElectronWebpackConfigTransformFactory: (options: any, buildElectronOptions: any, context: BuilderContext) => ({ root }: {
    root: any;
}, browserWebpackConfig: any) => Observable<any>;
export declare const electronWebpackConfigTransformFactory: any;
export declare const serverConfigTransformFactory: any;
export declare const execute: (options: DevServerBuilderSchema, context: BuilderContext) => Observable<BuilderOutput>;
export declare function openElectron(x: DevServerBuilderOutput, options: any, context: BuilderContext): Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<DevServerBuilderSchema>;
export default _default;
