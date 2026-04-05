import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus } from "../generated/client/index.js";
export class SubscriptionService {
    static async createSubscription(storeId, planId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // Default 1 month
        return await prisma.subscription.upsert({
            where: { storeId },
            update: {
                planId,
                status: SubscriptionStatus.ACTIVE,
                startDate,
                endDate
            },
            create: {
                storeId,
                planId,
                status: SubscriptionStatus.ACTIVE,
                startDate,
                endDate
            }
        });
    }
    static async getStoreSubscription(storeId) {
        const sub = await prisma.subscription.findUnique({
            where: { storeId },
            include: { plan: true }
        });
        return sub ?? null; // Return null instead of throwing when no subscription exists
    }
    static async checkStatus(storeId) {
        const sub = await prisma.subscription.findUnique({ where: { storeId } });
        if (!sub)
            return { isActive: false };
        const isActive = sub.status === SubscriptionStatus.ACTIVE && sub.endDate > new Date();
        return { isActive, sub };
    }
    static async subscribeToPlan(storeId, planId, gateway) {
        // Mock checkout URL for now
        const checkoutUrl = gateway === "RAZORPAY" ? "https://razorpay.com/checkout" : "https://stripe.com/checkout";
        // Create/Update sub in TRIAL status first or according to logic
        const sub = await this.createSubscription(storeId, planId);
        return { ...sub, checkoutUrl };
    }
    static async upgradeSubscription(storeId, planId, gateway) {
        const checkoutUrl = gateway === "RAZORPAY" ? "https://razorpay.com/checkout" : "https://stripe.com/checkout";
        const sub = await this.createSubscription(storeId, planId);
        return { ...sub, checkoutUrl };
    }
    static async activateSubscription(subscriptionId) {
        return await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.ACTIVE }
        });
    }
    static async cancelSubscription(subscriptionId) {
        return await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.CANCELLED }
        });
    }
    static async updatePaymentStatus(subscriptionId, status) {
        // Logic to update based on gateway feedback or manual admin action
        return await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: status }
        });
    }
    static async getAllSubscriptions(status) {
        const whereClause = status ? { status: status } : {};
        return await prisma.subscription.findMany({
            where: whereClause,
            include: { store: true, plan: true }
        });
    }
    static async getExpiringSubscriptions(days) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        return await prisma.subscription.findMany({
            where: {
                endDate: { lte: expiryDate, gte: new Date() },
                status: SubscriptionStatus.ACTIVE
            },
            include: { store: true }
        });
    }
    static async countByStatus(status) {
        return await prisma.subscription.count({
            where: { status: status }
        });
    }
}
