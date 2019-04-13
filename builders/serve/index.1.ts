import {
  createBuilder,
  targetFromTargetString,
  BuilderContext
} from "@angular-devkit/architect";
import {
  DevServerBuilderOutput,
  DevServerBuilderSchema,
  serveWebpackBrowser
} from "@angular-devkit/build-angular";
import { Observable, of, from, pipe } from "rxjs";

import { switchMap, tap } from "rxjs/operators";
import { spawn, ChildProcess } from "child_process";
import { join } from "@angular-devkit/core";

export const serveCustomWebpackBrowser = (
  options: DevServerBuilderSchema,
  context: BuilderContext
): Observable<DevServerBuilderOutput> => {
  async function setup() {
    console.log("Setup");
    const browserTarget = targetFromTargetString(options.browserTarget);
    console.log("Browser target ", browserTarget);

    const serverOptions = await context.getTargetOptions(browserTarget);
    console.log("Target Options", serverOptions);

    const overrides: Record<string, string | number | boolean> = {
      watch: false
    };
    const server = await context.scheduleTarget(browserTarget, overrides);
    let result;
    try {
      result = await server.result;
      console.log("Result ", result);
      console.log("Port ", result.port);
    } catch (error) {
      context.reportStatus("Error: " + error);
    }

    return context.getTargetOptions(browserTarget) as unknown;
  }

  return from(setup()).pipe(
    switchMap(browserOptions => serveWebpackBrowser(options, context)),
    tap(x => console.log(x))
  );
};

async function execute(
  options: DevServerBuilderSchema,
  context: BuilderContext
) {
  console.log("Current Directory ", context.currentDirectory);
  console.log("Options", options);
  const browserTarget = targetFromTargetString(options.browserTarget);

  console.log("Browser target ", browserTarget);

  const serverOptions = await context.getTargetOptions(browserTarget);
  console.log("Serve Options", serverOptions);
  const buildOptions = await context.getTargetOptions({
    project: "app1",
    target: "build"
  });
  console.log("build options ", buildOptions);

  const overrides: Record<string, string | number | boolean> = {
    watch: false
  };

  if (options.port !== undefined) {
    overrides.port = options.port;
  }

  const server = await context.scheduleTarget(browserTarget, overrides);
  let result;
  try {
    result = await server.result;
    console.log("Result ", result);
    console.log("Port ", result.port);
  } catch (error) {
    context.reportStatus("Error: " + error);
  }

  // await wait(10000);

  await openElectron(options.electronMain, result.port);

  return {
    success: true
  };
}

async function wait(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function isMac() {
  return /^darwin/.test(process.platform);
}

function openElectron(electronMain, port) {
  const electronBin = isMac()
    ? "./node_modules/.bin/electron"
    : "node_modules/electron/dist/electron";

  return new Promise((resolve, reject) => {
    const ls: ChildProcess = spawn(electronBin, [
      electronMain,
      "-port",
      port + ""
    ]);
    ls.stdout.on("data", function(data) {
      // Logger.info("ELECTRON WATCH (stdout): " + data.toString());
    });

    ls.stderr.on("data", function(data) {
      // Logger.error("ELECTRON WATCH (stderr): " + data.toString());
    });

    ls.on("exit", function(code) {
      // Logger.info("ELECTRON WATCH (exit): " + code.toString());
      // reject(0);
      resolve();
    });
  });
}

export default createBuilder<DevServerBuilderSchema, DevServerBuilderOutput>(
  execute
);
/*
export default createBuilder<DevServerBuilderSchema, DevServerBuilderOutput>(
  serveCustomWebpackBrowser
);
*/
