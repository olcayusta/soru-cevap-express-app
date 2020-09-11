"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_1 = require("./notification.service");
class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async getAllNotificationList() {
        return await this.notificationService.sendNotification('Fuck you!');
    }
}
exports.default = new NotificationController(new notification_service_1.NotificationService());
