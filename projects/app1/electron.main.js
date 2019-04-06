const { app, Menu, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");

const getUrlToLoad = () => {
  let urlToLoad = "";
  if (isLive) {
    urlToLoad = url.format({
      pathname: "localhost:" + port,
      protocol: "http:",
      slashes: true
    });
  } else {
    urlToLoad = url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true
    });
  }
  return urlToLoad;
};

process.env.NO_PROXY = "localhost, 127.0.0.1";

let port = 5555;
let isLive = false;
if (process.argv.length >= 4 && process.argv[2] === "-port") {
  isLive = true;
  port = process.argv[3];
}

let win;

function createWindow() {
  win = new BrowserWindow({ width: 1680, height: 1050 });
  win.loadURL(getUrlToLoad());

  if (process.env.NODE_ENV == "development") {
    win.webContents.openDevTools();
  }

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
