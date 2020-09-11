"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const ws_1 = require("../ws");
const cache_service_1 = require("../services/cache.service");
const app_1 = require("../app");
class NotificationService {
    async getNotifications(userId) {
        const cache = cache_service_1.cacheService.get('getNotifications');
        if (!cache) {
            const sql = `SELECT *
                         FROM notification
                         WHERE "receiverId" = $1`;
            const { rows } = await app_1.pool.query(sql, [userId]);
            cache_service_1.cacheService.set('getNotifications', rows);
        }
        return cache_service_1.cacheService.get('getNotifications');
    }
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
}
exports.NotificationService = NotificationService;
