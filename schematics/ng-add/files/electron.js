"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const url_1 = require("url");
const electron_1 = require("electron");
try {
    require('electron-reloader')(module);
}
catch (err) { }
let win;
function createWindow() {
    win = new electron_1.BrowserWindow({ width: 1680, height: 1050, webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: true
        } });
    win.loadURL(url_1.format({
        pathname: path_1.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    if (process.env.NODE_ENV == 'development') {
        win.webContents.openDevTools();
    }
    win.on('closed', () => {
        win = null;
    });
    win.webContents.session.webRequest.onHeadersReceived((d, c) => {
        if (d.responseHeaders['x-frame-options'] || d.responseHeaders['X-Frame-Options']) {
            delete d.responseHeaders['x-frame-options'];
            delete d.responseHeaders['X-Frame-Options'];
        }
        c({ cancel: false, responseHeaders: d.responseHeaders });
    });
}
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
//# sourceMappingURL=electron.js.map