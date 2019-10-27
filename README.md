# NgTron

![Alt text](ngtron.png?raw=true "NGTron Logo")

Angular + Electron = :heart:

Angular CLI extension based on Schematics and Builders for building angular based electron applications.
This project uses the new architect API which was introduced in Angular 8.
**So you can only use this addon starting with angular 8!**

Ngtron will setup your angular workspace with the finest electron tools available. [Electron Builder](https://github.com/electron-userland/electron-builder) is added to package your projects for mac, windows and linux.

[![npm version](https://badge.fury.io/js/%40richapps%2Fngtron.svg)](https://www.npmjs.com/@richapps/ngtron)

## Introduction

An typical electron project consists of node application which is called the **main process**. This main process can create BrowserWindows which contain web pages. Those web pages are called **renderer processes** in the context of electron. Consequently an ngtron project is a combination of different types of applications. This nicely fits with the multi project support of Angular workspaces. An ngtron project can have exactly one main (node) project and n renderer projects (normal angular projects). There is one more type which is an electron project type where this all configured. This flexible architecture allows to build electron apps which include multiple angular projects. You can for example open several windows each containing a different Angular application.

## Installation

NGTron supports the ng-add schematic to setupn an angular workspace. Running the schematic will install the @richapps/ngtron packages and setup further dependencies like electron-builder.

```bash
ng add @richapps/ngtron
```

## Setup

The recommended way of using ngtron is to use multiple projects for each type (main, renderer, electron) in an angular workspace. Beside that ngtron also supports root level projects which do not use multiple projects by adding the main process and electron files inside the renderer project. Here you will find an overview of the different setups.

## Creating an application as multiple projects in a workspace (recommended)

`ng new workspace --create-application=false`
`ng add @richapps/ngtron`
`ng generate @richapps/ngtron:app --project=myapp`

This will generate three projects in your worspace.

- **_myapp-electron_**
  This projects holds the electron specific configuration and assets like icons for your electron application.

- **_myapp-main_**
  This projects is a node project which will used for the main process of your application
- **_myapp-renderer_**
  This is the angular project where you can define your renderer code (Note: you can add more renderer projects if you for example want to open different angular apps in different windows of your electron app).

You can now run your app with:
`ng serve myapp-electron`
And package your app with:
`ng run myapp-electron:package`

## Using an existing angular project as the renderer for an electron app

`ng add @richapps/ngtron`

`ng generate @richapps/ngtron:app --project=<my-existing-project>

## Create a root level ngtron project

`ng new <my-project>`

`ng add @richapps/ngtron`

`ng generate @richapps/ngtron:app --project=<my-project> --singleProject=true`

## Adding ngtron to an existing root level project

`ng add @richapps/ngtron`

`ng generate @richapps/ngtron:app --project=my-existing-project --singleProject=true`

### Run app while developing (with hot reloading)

```bash
ng run project:build-electron
```

Builds the app and opens it in an electron window. Uses hot reloading whenever your code changes.

### Package your app

```bash
ng run project:package-electron
```

You can customize your build settings in the angular.json.
There you will find all the settings which you can use in electron-builder.

### Serve app in the browser

`ng run project:serve-electron`
This will serve your app in the browser even if you use node or electron apis.
Example will follow.
