import { wss1 } from '../ws'
import { cacheService } from '../services/cache.service';
import { pool } from '../app';

interface IData {
    celebName: string
    picture: string
}

export class NotificationService {
    async getNotifications(userId: number): Promise<any> {
        const cache = cacheService.get('getNotifications')
        if (!cache) {
            const sql = `SELECT *
                         FROM notification
                         WHERE "receiverId" = $1`
            const {rows} = await pool.query(sql, [userId])
            cacheService.set('getNotifications', rows)
        }
        return cacheService.get('getNotifications')
    }

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

