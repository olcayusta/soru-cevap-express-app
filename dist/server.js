"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const url_1 = require("url");
const ws_1 = require("./ws");
const PORT = 9001;
/**
 * SSL Configuration
 */
/*const server = https.createServer({
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt'),
}, app).listen(9001)*/
const server = app_1.default.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
server.on('upgrade', async (req, socket, head) => {
    /*  let client: any
  
      try {
          const token: string = req.headers['sec-websocket-protocol'] as string
          const decoded = await jwt.verify(token, 'jojo')
          // @ts-ignore
          const userId = +decoded.sub
  
          console.log(userId)
  
          client = {
              userId
          }
  
          if (!client) {
              socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n')
              socket.destroy()
              return
          }
      } catch (e) {
          throw e
      }*/
    const { pathname } = url_1.parse(req.url);
    if (pathname === '/') {
        ws_1.wss1.handleUpgrade(req, socket, head, ws => {
            ws_1.wss1.emit('connection', ws, req);
        });
    }
    else if (pathname === '/bar') {
        /* wss2.handleUpgrade(request, socket, head, function done(ws) {
             wss2.emit('connection', ws, request);
         });*/
    }
    else {
        // socket.destroy();
    }
});
exports.default = server;
