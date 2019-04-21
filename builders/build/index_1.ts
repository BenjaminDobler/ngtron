import { createBuilder, targetFromTargetString, BuilderContext } from "@angular-devkit/architect";
import { DevServerBuilderOutput, DevServerBuilderOptions } from "@angular-devkit/build-angular";

import { writeFileSync, copyFileSync } from "fs";
import { join, basename } from "path";
import { BUILD_IN_ELECTRON_MODULES, BUILD_IN_NODE_MODULES } from "../util/util";

const builder = require("electron-builder");

export const electronWebpackConfigTransformFactory: any = (options: any, buildElectronOptions: any, context: BuilderContext) => {
  return webpackConfig => {
    const externalDependencies = buildElectronOptions.electronPackage.dependencies;
    const rootNodeModules = join(context.workspaceRoot, "node_modules");
    let EXTERNALS = Object.keys(externalDependencies);
    EXTERNALS = [...EXTERNALS, ...BUILD_IN_ELECTRON_MODULES, ...BUILD_IN_NODE_MODULES];

    webpackConfig.externals = [
      (function() {
        return function(context, request, callback) {
          if (EXTERNALS.indexOf(request) >= 0) {
            return callback(null, "require('" + request + "')");
          }
          return callback();
        };
      })()
    ];

    webpackConfig.target = "electron-renderer";
    return webpackConfig;
  };
};

async function execute(options: any, context: BuilderContext) {
  console.log("Current Directory ", context.currentDirectory);
  console.log("Options", options);
  const browserTarget = targetFromTargetString(options.browserTarget);

  console.log("Browser target ", browserTarget);

  const serverOptions = await context.getTargetOptions(browserTarget);
  console.log("Serve Options", serverOptions);
  const buildOptions = await context.getTargetOptions({
    project: browserTarget.project,
    target: "build"
  });
  console.log("build options ", buildOptions);

  const overrides: Record<string, string | number | boolean> = {
    watch: false,
    baseHref: "./"
  };

  // TODO: how can we pass transforms here?!
  const server = await context.scheduleTarget(browserTarget, overrides);
  let result;
  try {
    result = await server.result;
  } catch (error) {
    context.reportStatus("Error: " + error);
  }

  // Copy electron main
  const fromMain = join(context.workspaceRoot, options.electronMain);
  const toMain = join(result.outputPath, basename(options.electronMain));
  copyFileSync(fromMain, toMain);

  // write electron package to dist
  writeFileSync(join(result.outputPath, "package.json"), JSON.stringify(options.electronPackage), { encoding: "utf-8" });

  // Build!
  try {
    await builder.build(options.packagerConfig);
  } catch (e) {
    console.log("Publish error", e);
  }

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

export default createBuilder<DevServerBuilderOptions, DevServerBuilderOutput>(execute);
