import { DevServerBuilderOutput } from "@angular-devkit/build-angular";
import { BuilderContext, BuilderOutput } from "@angular-devkit/architect";
import { Observable } from "rxjs";
import { ChildProcess, spawn } from "child_process";
import { isMac } from "../util/util";
const builder = require("electron-builder");

export function openElectron(x: DevServerBuilderOutput, electronMain: string, context: BuilderContext): Observable<BuilderOutput> {
  return new Observable(observer => {
    console.log("Open Electron ", electronMain);

    if (context.target.target === "serve-electron") {
      const electronBin = isMac() ? "./node_modules/.bin/electron" : "node_modules/electron/dist/electron";

      const ls: ChildProcess = spawn(electronBin, [electronMain]);
      ls.stdout.on("data", function(data) {
        context.logger.info(data.toString());
      });

      ls.stderr.on("data", function(data) {
        context.logger.error(data.toString());
      });

      ls.on("exit", function(code) {
        console.log("Exit");
        observer.next({ success: true });
      });
    } else {
      observer.next({ success: true });
    }
  });
}

export function buildElectron(config): Observable<BuilderOutput> {
  return new Observable(observer => {
    builder.build(config).then(
      () => {
        observer.next();
      },
      e => {
        console.log("Error ", e);
        observer.error();
      }
    );
  });
}
