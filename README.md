# NgTron

![Alt text](ngtron.png?raw=true "NGTron Logo")

Angular + Electron = :heart:

Angular CLI extension based on Schematics and Builders for building angular based electron applications.
This project uses the new architect API which is currently beta and will ship with angular 8 (so soon!).
**So you can only use this addon starting with angular 8!**

Ngtron will setup your angular workspace with the finest electron tools available. [Electron Builder](https://github.com/electron-userland/electron-builder) is added to package your projects for mac, windows and linux.
[Electron Reload](https://www.npmjs.com/package/electron-reload) is used to automatically reload your app while developing whenever you make code changes.

[![npm version](https://badge.fury.io/js/%40richapps%2Fngtron.svg)](https://www.npmjs.com/@richapps/ngtron)

## Installation

```bash
ng add @richapps/ngtron
```

## Usage

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

## Creating an application as multiple projects in a workspace

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

# Using an existing angular project as the renderer for an electron app

`ng add @richapps/ngtron`
`ng generate @richapps/ngtron:app --project=my-existing-project`

# Create a root level ngtron project

`ng new <my-project>`
`ng add @richapps/ngtron`
`ng generate @richapps/ngtron:app --project=<my-project>`

# Adding ngtron to an existing root level project

`ng add @richapps/ngtron`
`ng generate @richapps/ngtron:app --project=my-existing-project`
