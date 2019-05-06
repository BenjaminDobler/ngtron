export declare const BUILD_IN_NODE_MODULES: string[];
export declare const BUILD_IN_ELECTRON_MODULES: string[];
export declare function isMac(): boolean;
export declare const noneElectronWebpackConfigTransformFactory: any;
export declare const electronServeWebpackConfigTransformFactory: any;
export declare const electronBuildWebpackConfigTransformFactory: any;
import * as ts from "typescript";
export declare function compile(fileNames: string[], options: ts.CompilerOptions): void;
