import { Tree } from "@angular-devkit/schematics/src/tree/interface";
import { SchematicContext, chain, Rule, externalSchematic, mergeWith, apply, url, move, template } from "@angular-devkit/schematics";
import { updateWorkspace } from "@schematics/angular/utility/config";
import { getWorkspace as getWorkspace2 } from "@schematics/angular/utility/config";
import { ProjectType } from "@schematics/angular/utility/workspace-models";


export interface NgGenerateOptions {
  project: string;
}


export default function (options: NgGenerateOptions): Rule {
  console.log("Generate Electron App");
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      addRendererProject(options),
      addElectronProject(options),
      updateElectronWorkspace(options),
      addMainProject(options)
    ])(tree, _context);
  };
}

function updateElectronWorkspace(options): Rule {
  return async (tree: Tree, _context: SchematicContext) => {
    const workspace: any = getWorkspace2(tree);
    const projectName = options.project + '-electron';
    const rendererName = options.project + '-renderer';
    workspace.projects[projectName] = {
      projectType: ProjectType.Application,
      root: "projects/electron",
      architect: {
        build: {
          builder: "@richapps/ngtron:build",
          options: {
            rendererTargets: [rendererName + ":build"],
            mainTarget: "main:build-node",
            outputPath: "dist/" + projectName,
            rendererOutputPath: "dist/" + projectName + "/renderers",
            package: "projects/" + projectName + "/package.json"
          }
        },
        "serve": {
          "builder": "@richapps/ngtron:serve",
          "options": {
            "buildTarget": projectName + ":build"
          }
        },
        "package": {
          "builder": "@richapps/ngtron:package",
          "options": {
            "buildTarget": projectName + ":build",
            "packagerConfig": {
              "mac": ["zip", "dmg"],
              "config": {
                "appId": "some.id",
                "npmRebuild": false,
                "asar": false,
                "directories": {
                  "app": "dist/" + projectName,
                  "output": "dist/" + projectName + "-package",
                  "buildResources": "project/" + projectName + "/electronResources"
                },
                "electronVersion": "4.0.0"
              }
            }
          }
        }
      }
    }
    return updateWorkspace(workspace);
  }
}


export const addElectronProject = (options) => {
  return addElectronFiles('projects/' + options.project + '-electron');
}

export const addMainProject = (options) => {
  return addMainFiles('projects/' + options.project + '-main');
}

export const addRendererProject = (options: NgGenerateOptions) => {
  return externalSchematic('@schematics/angular', 'application', { name: options.project + '-renderer' });
}

function addElectronFiles(dest) {
  console.log("Dest ", dest);
  return (host: Tree, context: SchematicContext) => {
    // const project = getProject(host, options.project);
    return mergeWith(
      apply(url(`../files/electron`), [
        template({
          tmpl: ''
        }),
        move(dest)
      ]));
  }
}

function addMainFiles(dest) {
  console.log("Dest ", dest);
  return (host: Tree, context: SchematicContext) => {
    // const project = getProject(host, options.project);
    return mergeWith(
      apply(url(`../files/main`), [
        template({
          tmpl: ''
        }),
        move(dest)
      ]));
  }
}
