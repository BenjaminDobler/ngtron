import { getWorkspace, updateWorkspace } from "@schematics/angular/utility/config";
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from "@schematics/angular/utility/dependencies";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
import * as path from "path";
import { getProject } from "@schematics/angular/utility/project";

import { apply, chain, mergeWith, move, Rule, SchematicContext, template, Tree, url } from "@angular-devkit/schematics";


export interface NgAddOptions {
  project: string;
}

export default function (options: NgAddOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      addPackageJsonDependencies(),
      installPackageJsonDependencies()
    ])(tree, _context);
  };
}

function addPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {

    // TODO: Get latest electron dependency or let user choose
    const dependencies: NodeDependency[] = [
      { type: NodeDependencyType.Dev, version: "^6.0.12", name: "electron" },
      { type: NodeDependencyType.Dev, version: "~12.7.12", name: "@types/node" },
      { type: NodeDependencyType.Dev, version: "next", name: "@richapps/ngnode" },
      { type: NodeDependencyType.Dev, version: "next", name: "@richapps/build-angular" },
      { type: NodeDependencyType.Dev, version: "^6.2.0", name: "ts-loader" }
    ];

    dependencies.forEach(dependency => {
      addPackageJsonDependency(host, dependency);
      context.logger.log("info", `✅️ Added "${dependency.name}" into ${dependency.type}`);
    });

    return host;
  };
}

function installPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.log("info", `🔍 Installing packages...`);
    return host;
  };
}

