"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss1 = void 0;
const ws_1 = __importDefault(require("ws"));
exports.wss1 = new ws_1.default.Server({ noServer: true });
exports.wss1.on('connection', (ws, req, client) => {
    // console.log(wss1.clients.size)
    ws.on('message', data => {
        // console.log(`Received message ${data} from user ${client.userId}`)
    });
});
