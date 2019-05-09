# NgTron

![Alt text](ngtron.png?raw=true "NGTron Logo")

Angular CLI extension based on Schematics and Builders for building angular based electron applications.
This project uses the new architect API which is currently in Beta and will ship with angular 8.
**So you can only use this addon starting with angular 8!**

Ngtron will setup your angular workspace with the finest electron tools available. [Electron Builder](https://github.com/electron-userland/electron-builder) is added to package your projects for mac, windows and linux.
[Electron Reload](https://www.npmjs.com/package/electron-reload) is used to automatically reload your app while developing whenever you make code changes.


# Installation
`ng add @richapps/ngtron`

# Usage

### Run app while developing (with hot reloading)
`ng run project:build-electron`

### Package your app
`ng run project:package-electron`

### Serve app in the browser
`ng run project:serve-electron`


