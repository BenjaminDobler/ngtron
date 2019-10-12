import { join } from 'path';
import { format } from 'url';
import { app, BrowserWindow } from 'electron';


function createWindow(path: string) {
  const url = format({
    pathname: path,
    protocol: 'file:',
    slashes: true
  });
  let win: BrowserWindow = new BrowserWindow({ width: 800, height: 700, webPreferences: { nodeIntegration: true } });
  win.loadURL(url);
  win.on('closed', () => {
    win = null;
  });
  return win;
}


app.on('ready', () => {
  createWindow(join(__dirname, 'renderers', 'frontend', 'index.html'));
});

app.on('window-all-closed', () => {
  app.quit();
});



