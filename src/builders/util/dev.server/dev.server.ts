import { readFileSync } from 'fs-extra';
import { join } from 'path';

const WebSocket = require('ws');

export class DevServer {
    clients: any[] = [];

    constructor(private port) {
        this.init();
    }

    init() {
        const wss = new WebSocket.Server({ port: this.port });
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
        let inject = readFileSync(join(__dirname, 'inject.js'), { encoding: 'utf-8' });
        inject = inject.replace(/\${this.port}/, this.port);
        return inject;
    }
}
