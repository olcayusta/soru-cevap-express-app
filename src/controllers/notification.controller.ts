import { NotificationService } from './notification.service';

class NotificationController {
    constructor(
        private notificationService: NotificationService
    ) {
    }

    async getAllNotificationList() {
        return await this.notificationService.sendNotification('Fuck you!')
    }
}

export default new NotificationController(
    new NotificationService()
)


