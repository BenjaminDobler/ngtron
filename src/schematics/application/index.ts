import { Tree } from "@angular-devkit/schematics/src/tree/interface";
import { SchematicContext, chain, Rule, externalSchematic, mergeWith, apply, url, move, template } from "@angular-devkit/schematics";
import { updateWorkspace } from "@schematics/angular/utility/config";
import { getWorkspace as getWorkspace2 } from "@schematics/angular/utility/config";
import { ProjectType } from "@schematics/angular/utility/workspace-models";
import { experimental } from "@angular-devkit/core";
import { JsonParseMode, parseJson } from '@angular-devkit/core';


export interface NgGenerateOptions {
  project: string;
  singleProject: boolean;
  monoRepo: boolean;
  rendererRoot: string;
  rendererPrefix: string;
  mainPrefix: string;
  electronPrefix: string;
  projectRoot: string;
}


export default function (options: NgGenerateOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {

    const workspace: any = getWorkspace2(tree);
    options.projectRoot = workspace.newProjectRoot || 'projects';

    const projectExists = workspace.projects.hasOwnProperty(options.project);
    let isMonoRepo = true;
    if (projectExists) {
      isMonoRepo = workspace.projects[options.project].sourceRoot !== 'src';
      options.rendererRoot = workspace.projects[options.project].sourceRoot;
    } else {
      options.rendererRoot = options.singleProject ? options.projectRoot + "/" + options.project : options.projectRoot + "/" + options.project + options.rendererPrefix;
    }

    options.monoRepo = isMonoRepo;

    let rules = [];
    if (!options.singleProject || (options.singleProject && !projectExists)) {
      rules.push(addRendererProject(options))
    }
    rules = [...rules, ...[
      addElectronProject(options),
      updateElectronWorkspace(options),
      addMainProject(options),
      updateMainWorkspace(options),
      updateRendererWorkspace(options),
      updateRendererTSConfig(options)
    ]];
    return chain(rules)(tree, _context);
  };
}

function updateElectronWorkspace(options): Rule {
  console.log("updateElectronWorkspace");
  return async (tree: Tree, _context: SchematicContext) => {
    const workspace: any = getWorkspace2(tree);
    const projectName = options.singleProject ? options.project : options.project + options.electronPrefix;
    const rendererName = options.singleProject ? options.project : options.project + options.rendererPrefix;
    const mainName = options.singleProject ? options.project : options.project + options.mainPrefix;

    let architectBuildName = options.singleProject ? 'build-electron' : 'build';
    let architectServeName = options.singleProject ? 'serve-electron' : 'serve';
    let architectPackageName = options.singleProject ? 'package-electron' : 'package';

    let mainBuildTarget = options.singleProject ? options.project + ':build-node' : mainName + ":build";
    let packagePath = options.singleProject ? options.rendererRoot + "/electron/package.json" : options.projectRoot + '/' + projectName + "/package.json"
    let buildResourcesPath = options.singleProject ? options.rendererRoot + "/electron/electronResources" : options.projectRoot + "/" + projectName + "/electronResources";
    if (!options.singleProject) {
      workspace.projects[projectName] = {
        projectType: ProjectType.Application,
        root: options.projectRoot + "/electron",
        architect: {}
      }
    }
    const architect = workspace.projects[projectName].architect;


    architect[architectBuildName] = {
      builder: "@richapps/ngtron:build",
      options: {
        rendererTargets: [rendererName + ":build"],
        mainTarget: mainBuildTarget,
        outputPath: "dist/" + projectName,
        rendererOutputPath: "dist/" + projectName + "/renderers",
        package: packagePath
      }
    };

    architect[architectServeName] = {
      builder: "@richapps/ngtron:serve",
      options: {
        buildTarget: projectName + ":" + architectBuildName
      }
    };

    architect[architectPackageName] = {
      builder: "@richapps/ngtron:package",
      options: {
        buildTarget: projectName + ":" + architectBuildName,
        packagerConfig: {
          mac: ["zip", "dmg"],
          config: {
            appId: "some.id",
            npmRebuild: false,
            asar: false,
            directories: {
              app: "dist/" + projectName,
              output: "dist/" + projectName + "-package",
              buildResources: buildResourcesPath
            },
            electronVersion: "4.0.0"
          }
        }
      }
    };


    return updateWorkspace(workspace);
  }
}


function updateMainWorkspace(options): Rule {
  console.log("⚙️  updateMainWorkspace");

  return async (tree: Tree, _context: SchematicContext) => {
    const workspace: any = getWorkspace2(tree);
    const projectName = options.singleProject ? options.project : options.project + options.mainPrefix;
    const architectBuildName = options.singleProject ? 'build-node' : 'build';
    const mainTsPath = options.singleProject ? options.rendererRoot + "/electron/src/main.ts" : options.projectRoot + "/" + projectName + "/src/main.ts";
    const mainTsConfigPath = options.singleProject ? options.rendererRoot + "/electron/tsconfig.json" : options.projectRoot + "/" + projectName + "/tsconfig.json"
    if (!options.singleProject) {
      workspace.projects[projectName] = {
        projectType: "application",
        root: options.projectRoot + "/" + projectName,
        sourceRoot: options.projectRoot + "/" + projectName + "/src",
        architect: {}
      };
    }

    const architect = workspace.projects[projectName].architect;
    architect[architectBuildName] = {
      builder: "@richapps/ngnode:build",
      options: {
        outputPath: "dist/" + projectName,
        main: mainTsPath,
        tsConfig: mainTsConfigPath
      }
    };

    return updateWorkspace(workspace);
  }
}

function updateRendererWorkspace(options): Rule {
  console.log("⚙️  updateRendererWorkspace");

  return async (tree: Tree, _context: SchematicContext) => {
    const workspace: any = getWorkspace2(tree);
    const projectName = options.singleProject ? options.project : options.project + options.rendererPrefix;
    workspace.projects[projectName].architect.build.builder = '@richapps/build-angular:browser'
    return updateWorkspace(workspace);
  }
}


function updateRendererTSConfig(options): Rule {
  console.log('️️⚙️  updateRendererTSConfig');
  return async (tree: Tree, _context: SchematicContext) => {
    const tsConfigRoot = options.monoRepo ? options.rendererRoot : '';
    const config: any = getTSAppConfig(tree, tsConfigRoot);
    config.compilerOptions.target = 'es5';
    if (!options.isMonoRepo) {
      config.exclude = config.exclude ? [...config.exclude, 'src/electron/**/*'] : config.exclude = ['src/electron/**/*'];
    }
    return updateTSAppConfig(config, tsConfigRoot);
  }
}


export function updateTSAppConfig(config: any, rendererRoot): Rule {
  return (host: Tree, context: SchematicContext) => {
    host.overwrite(getTSAppConfigPath(host, rendererRoot), JSON.stringify(config, null, 2));
  };
}

export function getTSAppConfigPath(host: Tree, rendererRoot): string {
  const possibleFiles = [rendererRoot + '/tsconfig.app.json'];
  const path = possibleFiles.filter(path => host.exists(path))[0];
  return path;
}

export function getTSAppConfig(host: Tree, project: string): any {
  const path = getTSAppConfigPath(host, project);
  const configBuffer = host.read(path);
  if (configBuffer === null) {
    throw new Error(`Could not find (${path})`);
  }
  const content = configBuffer.toString();

  return parseJson(content, JsonParseMode.Loose) as {} as any;
}


export const addElectronProject = (options) => {
  console.log('⚙️  addElectronProject');

  const dir = options.singleProject ? options.rendererRoot + '/electron' : options.projectRoot + '/' + options.project + options.electronPrefix;
  return addElectronFiles(dir);
}

export const addMainProject = (options) => {
  console.log('⚙️  addMainProject');

  const dir = options.singleProject ? options.rendererRoot + '/electron' : options.projectRoot + '/' + options.project + options.mainPrefix;
  const rendererName = options.singleProject ? options.project : options.project + options.rendererPrefix;
  return addMainFiles(dir, rendererName);
}

export const addRendererProject = (options: NgGenerateOptions) => {
  console.log('⚙️  addRendererProject');

  const rendererName = options.singleProject ? options.project : options.project + options.rendererPrefix;
  return externalSchematic('@schematics/angular', 'application', { name: rendererName });
}

function addElectronFiles(dest) {
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

function addMainFiles(dest, renderer) {
  return (host: Tree, context: SchematicContext) => {
    // const project = getProject(host, options.project);
    return mergeWith(
      apply(url(`../files/main`), [
        template({
          renderer,
          tmpl: ''
        }),
        move(dest)
      ]));
  }
}
