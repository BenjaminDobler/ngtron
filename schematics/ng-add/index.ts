import { Schema } from "./schema";
import {
  getWorkspace,
  updateWorkspace
} from "@schematics/angular/utility/config";
import {
  addPackageJsonDependency,
  NodeDependency,
  NodeDependencyType
} from "@schematics/angular/utility/dependencies";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";

import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from "@angular-devkit/schematics";
import {
  ProjectType,
  WorkspaceProject,
  WorkspaceSchema
} from "@schematics/angular/utility/workspace-models";
import { Observable, of } from "rxjs";
import { concatMap, map } from "rxjs/operators";

export default function(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    console.log("ngtron add! ", options.project);

    return chain([
      updateArchitect(options),
      addPackageJsonDependencies(),
      installPackageJsonDependencies()
    ])(tree, _context);
  };
}

function updateArchitect(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const project = options.project;
    const workspace = getWorkspace(tree);

    const architect = workspace.projects[project].architect;
    if (!architect)
      throw new Error(
        `expected node projects/${project}/architect in angular.json`
      );

    architect["serve-electron"] = {
      builder: "@richapps/ngtron:serve",
      options: {
        browserTarget: project + ":serve",
        electronMain: "projects/" + project + "/electron.main.js"
      }
    };

    architect["build-electron"] = {
      builder: "./builders:build",
      options: {
        browserTarget: "app1:build",
        electronMain: "projects/" + project + "/electron.main.js",
        electronPackage: {
          version: "0.0.0",
          name: project,
          main: "electron.main.js",
          dependencies: {}
        },
        packagerConfig: {
          mac: ["zip", "dmg"],
          config: {
            appId: "some.id",
            npmRebuild: false,
            asar: false,
            directories: {
              app: "dist/" + project,
              output: "dist/" + project + "-electron",
              buildResources: "projects/" + +"/electronResources"
            },
            electronVersion: "4.0.0"
          }
        }
      }
    };
    return updateWorkspace(workspace);
  };
}

function addPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    const dependencies: NodeDependency[] = [
      { type: NodeDependencyType.Dev, version: "~4.0.0", name: "electron" },
      {
        type: NodeDependencyType.Dev,
        version: "13.1.1",
        name: "electron-packager"
      }
    ];

    dependencies.forEach(dependency => {
      addPackageJsonDependency(host, dependency);
      context.logger.log(
        "info",
        `✅️ Added "${dependency.name}" into ${dependency.type}`
      );
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
