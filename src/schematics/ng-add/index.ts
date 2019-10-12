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
      updateArchitect(options),
      addFiles(options),
      addPackageJsonDependencies(),
      installPackageJsonDependencies()
    ])(tree, _context);
  };
}

function updateArchitect(options: NgAddOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const workspace = getWorkspace(tree);
    const project = getProject(tree, options.project);
    const projectName = options.project;

    if (!project.sourceRoot && !project.root) {
      project.sourceRoot = "src";
    } else if (!project.sourceRoot) {
      project.sourceRoot = path.join(project.root, "src");
    }

    const architect = workspace.projects[projectName].architect;
    if (!architect) throw new Error(`expected node projects/${projectName}/architect in angular.json`);

    architect["build-electron"] = {
      builder: "@richapps/ngtron:build",
      options: {
        browserTarget: projectName + ":build",
        electronMain: project.sourceRoot + "/electron.ts"
      }
    };

    architect["package-electron"] = {
      builder: "@richapps/ngtron:package",
      options: {
        browserTarget: projectName + ":build",
        electronMain: project.sourceRoot + "/electron.ts",
        electronPackage: {
          version: "0.0.0",
          name: projectName,
          main: "electron.js",
          dependencies: {}
        },
        packagerConfig: {
          mac: ["zip", "dmg"],
          config: {
            appId: "some.id",
            npmRebuild: false,
            asar: false,
            directories: {
              app: "dist/" + projectName,
              output: "dist/" + projectName + "-electron",
              buildResources: project.root + "/electronResources"
            },
            electronVersion: "4.0.0"
          }
        }
      }
    };

    architect["serve-electron"] = {
      builder: "@richapps/ngtron:serve",
      options: {
        browserTarget: projectName + ":build"
      }
    };

    return updateWorkspace(workspace);
  };
}

function addPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {

    // TODO: Get latest electroin dependency or let user choose
    const dependencies: NodeDependency[] = [
      { type: NodeDependencyType.Dev, version: "~4.0.0", name: "electron" },
      { type: NodeDependencyType.Dev, version: "20.39.0", name: "electron-builder" },
      { type: NodeDependencyType.Dev, version: "^8.10.46", name: "@types/node" },
      { type: NodeDependencyType.Dev, version: "^0.2.0", name: "electron-reloader" }
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

function addFiles(options) {
  return (host: Tree, context: SchematicContext) => {
    const project = getProject(host, options.project);
    return mergeWith(
      apply(url(`../files/electron`), [
        template({
          tmpl: ''
        }),
        move(project.root)
      ]));
  }
}
