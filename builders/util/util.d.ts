import { BuilderContext } from "@angular-devkit/architect";
export declare const BUILD_IN_NODE_MODULES: string[];
export declare const BUILD_IN_ELECTRON_MODULES: string[];
export declare function isMac(): boolean;
export declare const noneElectronWebpackConfigTransformFactory: (options: any, buildElectronOptions: any, context: BuilderContext) => ({ root }: {
    root: any;
}, browserWebpackConfig: any) => import("rxjs").Observable<any>;
export declare const electronServeWebpackConfigTransformFactory: any;
export declare const electronBuildWebpackConfigTransformFactory: any;
