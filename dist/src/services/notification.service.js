import { prisma } from "../lib/prisma.js";
import { withDbRetry } from "../utils/db-utils.js";
export class NotificationService {
    static async createNotification(data) {
        return await prisma.notification.create({
            data: {
                title: data.title,
                message: data.message,
                type: data.type || "info",
                userId: data.userId,
            },
        });
    }
    static async getNotifications(userId) {
        return await withDbRetry(() => prisma.notification.findMany({
            where: userId ? { userId } : { userId: null },
            orderBy: { createdAt: "desc" },
            take: 20,
        }));
    }
    static async markAsRead(id) {
        return await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    static async markAllAsRead(userId) {
        return await prisma.notification.updateMany({
            where: userId ? { userId, isRead: false } : { userId: null, isRead: false },
            data: { isRead: true },
        });
    }
    static async deleteNotification(id) {
        return await prisma.notification.delete({
            where: { id },
        });
    }
}
