import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
import { SubscriptionPlan, SubscriptionStatus } from "../generated/client/index.js";

export class SubscriptionService {
  static async createSubscription(storeId: number, planId: number) {
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

  static async getStoreSubscription(storeId: number) {
    const sub = await prisma.subscription.findUnique({
      where: { storeId },
      include: { plan: true }
    });
    return sub ?? null; // Return null instead of throwing when no subscription exists
  }

  static async checkStatus(storeId: number) {
    const sub = await prisma.subscription.findUnique({ where: { storeId } });
    if (!sub) return { isActive: false };
    
    const isActive = sub.status === SubscriptionStatus.ACTIVE && sub.endDate > new Date();
    return { isActive, sub };
  }

  static async subscribeToPlan(storeId: number, planId: number, gateway: string) {
    // Mock checkout URL for now
    const checkoutUrl = gateway === "RAZORPAY" ? "https://razorpay.com/checkout" : "https://stripe.com/checkout";
    
    // Create/Update sub in TRIAL status first or according to logic
    const sub = await this.createSubscription(storeId, planId);
    
    return { ...sub, checkoutUrl };
  }

  static async upgradeSubscription(storeId: number, planId: number, gateway: string) {
    const checkoutUrl = gateway === "RAZORPAY" ? "https://razorpay.com/checkout" : "https://stripe.com/checkout";
    const sub = await this.createSubscription(storeId, planId);
    return { ...sub, checkoutUrl };
  }

  static async activateSubscription(subscriptionId: number) {
    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.ACTIVE }
    });
  }

  static async cancelSubscription(subscriptionId: number) {
    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.CANCELLED }
    });
  }

  static async updatePaymentStatus(subscriptionId: number, status: string) {
    // Logic to update based on gateway feedback or manual admin action
    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: status as SubscriptionStatus }
    });
  }

  static async getAllSubscriptions(status?: string) {
    const whereClause = status ? { status: status as SubscriptionStatus } : {};
    return await prisma.subscription.findMany({
      where: whereClause,
      include: { store: true, plan: true }
    });
  }

  static async getExpiringSubscriptions(days: number) {
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

  static async countByStatus(status: string) {
    return await prisma.subscription.count({
      where: { status: status as SubscriptionStatus }
    });
  }
}
