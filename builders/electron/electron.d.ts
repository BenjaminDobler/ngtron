import { DevServerBuilderOutput } from "@angular-devkit/build-angular";
import { BuilderContext, BuilderOutput } from "@angular-devkit/architect";
import { Observable } from "rxjs";
export declare function openElectron(x: DevServerBuilderOutput, options: any, context: BuilderContext): Observable<BuilderOutput>;
export declare function buildElectron(config: any): Observable<BuilderOutput>;
