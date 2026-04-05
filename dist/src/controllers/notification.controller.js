import { NotificationService } from "../services/notification.service.js";
export class NotificationController {
    static async getNotifications(req, res, next) {
        try {
            const userId = req.user?.userId;
            const notifications = await NotificationService.getNotifications(userId);
            res.status(200).json(notifications);
        }
        catch (error) {
            next(error);
        }
    }
    static async markAsRead(req, res, next) {
        try {
            const notification = await NotificationService.markAsRead(Number(req.params.id));
            res.status(200).json(notification);
        }
        catch (error) {
            next(error);
        }
    }
    static async markAllAsRead(req, res, next) {
        try {
            const userId = req.user?.userId;
            await NotificationService.markAllAsRead(userId);
            res.status(200).json({ message: "All notifications marked as read" });
        }
        catch (error) {
            next(error);
        }
    }
}
