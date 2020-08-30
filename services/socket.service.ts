import { wss1 } from '../ws'

interface IData {
    celebName: string
    picture: string
}

class SocketService {
    async sendNotification(msg: string): Promise<IData> {
        const data = {
            celebName: 'Lisa Joyce',
            picture: 'https://www.theatricalindex.com/media/cimage/persons/lisa-joyce/headshot_headshot.jpg'
        }

        wss1.clients.forEach(client => {
            client.send(JSON.stringify(data))
        })
        return data
    }

    async sendHello(msg: string): Promise<string> {
        const data = 'hello world'

        wss1.clients.forEach(value => {
            value.send(JSON.stringify({
                msg: data
            }))
        })
        return data
    }
}

export const socketService = new SocketService()
