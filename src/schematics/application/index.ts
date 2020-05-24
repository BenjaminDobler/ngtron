import { Tree } from '@angular-devkit/schematics/src/tree/interface';
import { SchematicContext, chain, Rule, externalSchematic, mergeWith, apply, url, move, template, noop } from '@angular-devkit/schematics';
import { updateWorkspace } from '@schematics/angular/utility/config';
import { getWorkspace as getWorkspace2 } from '@schematics/angular/utility/config';
import { ProjectType } from '@schematics/angular/utility/workspace-models';
import { JsonParseMode, parseJson } from '@angular-devkit/core';
import * as inquirer from 'inquirer';
import { Observable } from 'rxjs';

export interface NgGenerateOptions {
    project: string;
    singleProject: boolean;
    monoRepo: boolean;
    rendererRoot: string;
    rendererPrefix: string;
    mainPrefix: string;
    electronPrefix: string;
    projectRoot: string;
    name: string;
    electronName: string;
    mainName: string;
    rendererName: string;
    createRenderer: boolean;
}

async function setup(tree, options, context: SchematicContext) {
    if (!options.name && !options.project) {
        const result = await inquirer.prompt<{ analytics: boolean }>([
            {
                name: 'project',
                message: `What name should your project have?`,
            },
        ]);
        options.project = result.project;
    }

    if (options.name && !options.project) {
        options.project = options.name;
    }

    const workspace: any = getWorkspace2(tree);
    options.projectRoot = workspace.newProjectRoot || 'projects';

    const rendererProjectExists = workspace.projects.hasOwnProperty(options.project);
    let isMonoRepo = true;
    if (rendererProjectExists) {
        isMonoRepo = workspace.projects[options.project].sourceRoot !== 'src';
        options.rendererRoot = workspace.projects[options.project].root;
    } else {
        options.rendererRoot = options.singleProject
            ? options.projectRoot + '/' + options.project
            : options.projectRoot + '/' + options.project + options.rendererPrefix;
    }

    options.monoRepo = isMonoRepo;
    options.electronName = options.singleProject ? options.project : options.project + options.electronPrefix;
    options.rendererName = options.singleProject ? options.project : options.project + options.rendererPrefix;
    options.mainName = options.singleProject ? options.project : options.project + options.mainPrefix;
    if (rendererProjectExists) {
        options.rendererName = options.project;
    }
    options.createRenderer = !rendererProjectExists;
}

function setupRule(options: any): Rule {
    return (host: Tree, context: SchematicContext) => {
        const observer = new Observable<Tree>((observer) => {
            setup(host, options, context).then(() => {
                observer.next(host);
                observer.complete();
            });
        });
        return observer;
    };
}

export default function (options: NgGenerateOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const rules = [
            setupRule(options),
            addRendererProject(options),
            addElectronProject(options),
            updateElectronWorkspace(options),
            addMainProject(options),
            updateMainWorkspace(options),
            updateRendererWorkspace(options),
            updateRendererTSConfig(options),
        ];
        return chain(rules)(tree, context);
    };
}

function updateElectronWorkspace(options): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.info('⚙️  updateElectronWorkspace');

        const workspace: any = getWorkspace2(tree);

        let architectBuildName = options.singleProject ? 'build-electron' : 'build';
        let architectServeName = options.singleProject ? 'serve-electron' : 'serve';
        let architectPackageName = options.singleProject ? 'package-electron' : 'package';

        let mainBuildTarget = options.singleProject ? options.project + ':build-node' : options.mainName + ':build';

        let packagePath = options.singleProject
            ? options.rendererRoot + '/electron/package.json'
            : options.projectRoot + '/' + options.electronName + '/package.json';

        let buildResourcesPath = options.singleProject
            ? options.rendererRoot + '/electron/electronResources'
            : options.projectRoot + '/' + options.electronName + '/electronResources';
        if (!options.singleProject) {
            workspace.projects[options.electronName] = {
                projectType: ProjectType.Application,
                root: options.projectRoot + '/electron',
                architect: {},
            };
        }
        const architect = workspace.projects[options.electronName].architect;

        architect[architectBuildName] = {
            builder: '@richapps/ngtron:build',
            options: {
                rendererTargets: [options.rendererName + ':build'],
                mainTarget: mainBuildTarget,
                outputPath: 'dist/' + options.electronName,
                rendererOutputPath: 'dist/' + options.electronName + '/renderers',
                package: packagePath,
            },
        };

        architect[architectServeName] = {
            builder: '@richapps/ngtron:serve',
            options: {
                buildTarget: options.electronName + ':' + architectBuildName,
            },
        };

        architect[architectPackageName] = {
            builder: '@richapps/ngtron:package',
            options: {
                buildTarget: options.electronName + ':' + architectBuildName,
                packagerConfig: {
                    mac: ['zip', 'dmg'],
                    config: {
                        appId: 'some.id',
                        npmRebuild: false,
                        asar: false,
                        directories: {
                            app: 'dist/' + options.electronName,
                            output: 'dist/' + options.electronName + '-package',
                            buildResources: buildResourcesPath,
                        },
                        electronVersion: '4.0.0',
                    },
                },
            },
        };

        return updateWorkspace(workspace);
    };
}

function updateMainWorkspace(options): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.info('⚙️  updateMainWorkspace');
        const workspace: any = getWorkspace2(tree);
        const architectBuildName = options.singleProject ? 'build-node' : 'build';
        const mainTsPath = options.singleProject
            ? options.rendererRoot + '/electron/src/main.ts'
            : options.projectRoot + '/' + options.mainName + '/src/main.ts';
        const mainTsConfigPath = options.singleProject
            ? options.rendererRoot + '/electron/tsconfig.json'
            : options.projectRoot + '/' + options.mainName + '/tsconfig.json';
        if (!options.singleProject) {
            workspace.projects[options.mainName] = {
                projectType: 'application',
                root: options.projectRoot + '/' + options.mainName,
                sourceRoot: options.projectRoot + '/' + options.mainName + '/src',
                architect: {},
            };
        }

        const architect = workspace.projects[options.mainName].architect;
        architect[architectBuildName] = {
            builder: '@richapps/ngnode:build',
            options: {
                outputPath: 'dist/' + options.mainName,
                main: mainTsPath,
                tsConfig: mainTsConfigPath,
            },
        };

        return updateWorkspace(workspace);
    };
}

function updateRendererWorkspace(options): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.info('⚙️  updateRendererWorkspace');
        const workspace: any = getWorkspace2(tree);
        workspace.projects[options.rendererName].architect.build.builder = '@richapps/build-angular:browser';
        return updateWorkspace(workspace);
    };
}

function updateRendererTSConfig(options): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.info('️️⚙️  updateRendererTSConfig');
        const tsConfigRoot = options.monoRepo ? options.rendererRoot : '';
        const config: any = getTSAppConfig(tree, tsConfigRoot);
        config.compilerOptions.target = 'es5';
        if (!options.isMonoRepo) {
            config.exclude = config.exclude ? [...config.exclude, 'src/electron/**/*'] : (config.exclude = ['src/electron/**/*']);
        }
        return updateTSAppConfig(config, tsConfigRoot);
    };
}

export function updateTSAppConfig(config: any, rendererRoot): Rule {
    return (host: Tree) => {
        host.overwrite(getTSAppConfigPath(host, rendererRoot), JSON.stringify(config, null, 2));
    };
}

export function getTSAppConfigPath(host: Tree, rendererRoot): string {
    const possibleFiles = [rendererRoot + '/tsconfig.app.json'];
    const path = possibleFiles.filter((path) => host.exists(path))[0];
    return path;
}

export function getTSAppConfig(host: Tree, project: string): any {
    const path = getTSAppConfigPath(host, project);
    const configBuffer = host.read(path);
    if (configBuffer === null) {
        throw new Error(`Could not find (${path})`);
    }
    const content = configBuffer.toString();
    return (parseJson(content, JsonParseMode.Loose) as {}) as any;
}

export const addElectronProject = (options) => {
    return (host: Tree, context: SchematicContext) => {
        context.logger.info('⚙️  addElectronProject');
        const dir = options.singleProject ? options.rendererRoot + '/electron' : options.projectRoot + '/' + options.project + options.electronPrefix;
        return addElectronFiles(dir);
    };
};

export const addMainProject = (options) => {
    return (host: Tree, context: SchematicContext) => {
        context.logger.info('⚙️  addMainProject');
        const dir = options.singleProject ? options.rendererRoot + '/electron' : options.projectRoot + '/' + options.project + options.mainPrefix;
        return addMainFiles(dir, options.rendererName);
    };
};

export const addRendererProject = (options: NgGenerateOptions) => {
    return (host: Tree, context: SchematicContext) => {
        if (options.createRenderer) {
            context.logger.info('⚙️  addRendererProject');
            return externalSchematic('@schematics/angular', 'application', {
                name: options.rendererName,
            });
        }
    };
};

function addElectronFiles(dest) {
    return () => {
        // const project = getProject(host, options.project);
        return mergeWith(
            apply(url(`../files/electron`), [
                template({
                    tmpl: '',
                }),
                move(dest),
            ])
        );
    };
}

function addMainFiles(dest, renderer) {
    return () => {
        // const project = getProject(host, options.project);
        return mergeWith(
            apply(url(`../files/main`), [
                template({
                    renderer,
                    tmpl: '',
                }),
                move(dest),
            ])
        );
    };
}
