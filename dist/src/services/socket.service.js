"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const ws_1 = require("../ws");
class SocketService {
    async sendNotification(msg) {
        const data = {
            celebName: 'Lisa Joyce',
            picture: 'https://www.theatricalindex.com/media/cimage/persons/lisa-joyce/headshot_headshot.jpg'
        };
        ws_1.wss1.clients.forEach(client => {
            client.send(JSON.stringify(data));
        });
        return data;
    }
    async sendHello(msg) {
        const data = 'hello world';
        ws_1.wss1.clients.forEach(value => {
            value.send(JSON.stringify({
                msg: data
            }));
        });
        return data;
    }
}
exports.socketService = new SocketService();
