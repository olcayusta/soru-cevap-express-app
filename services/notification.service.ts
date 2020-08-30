import { wss1 } from '../ws'

interface IData {
    celebName: string
    picture: string
}

class NotificationService {
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
}

export const notificationService = new NotificationService()
