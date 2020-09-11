import ws from 'ws'
import http from 'http'

export const wss1 = new ws.Server({noServer: true});

wss1.on('connection', (ws: ws, req: http.IncomingMessage, client: any) => {
    // console.log(wss1.clients.size)
    ws.on('message', data => {

        // console.log(`Received message ${data} from user ${client.userId}`)
    })
});
