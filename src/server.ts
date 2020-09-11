import app from './app'
import { parse } from 'url'
import { wss1 } from './ws'

const PORT = 9001

/**
 * SSL Configuration
 */
/*const server = https.createServer({
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt'),
}, app).listen(9001)*/

const server = app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`))

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

  const {pathname} = parse(req.url)

  if (pathname === '/') {
    wss1.handleUpgrade(req, socket, head, ws => {
      wss1.emit('connection', ws, req)
    })
  } else if (pathname === '/bar') {
    /* wss2.handleUpgrade(request, socket, head, function done(ws) {
         wss2.emit('connection', ws, request);
     });*/
  } else {
    // socket.destroy();
  }
})

export default server
