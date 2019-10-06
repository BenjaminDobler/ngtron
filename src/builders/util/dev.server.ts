const WebSocket = require('ws');

export class DevServer {


  clients: any[] = [];

  constructor(private port) {
    this.init();
  }


  init() {
    const wss = new WebSocket.Server({ port: 6001 });
    wss.on('connection', (ws) => {
      this.clients.push(ws);
    });
  }

  sendUpdate(data) {
    this.clients.forEach((ws) => {
      ws.send(JSON.stringify(data));
    });
  }


  getInject() {
    return `
              const electron = require('electron');
              const WebSocket = require('ws');
              const socket = new WebSocket('ws://localhost:6001');

                socket.on('open', () => {
                  console.log('Connected to live server...');
                });

                socket.on('message', (message)=> {
                  const m = JSON.parse(message);
                  if (m.type === 'renderer') {
                    console.log("Renderer reloaded");
                    for (const window_ of electron.BrowserWindow.getAllWindows()) {
                      if(window_.webContents.getURL().includes(m.info.outputPath)) {
                        window_.webContents.reloadIgnoringCache();
                      }
                    }
                  } else {
                    // electron.app.relaunch();
                    // electron.app.exit(0);
                  }
                });

                socket.on('close', () => {

                });

                socket.on('error', () => {
                  // Noop
                });
      `

  }


}
