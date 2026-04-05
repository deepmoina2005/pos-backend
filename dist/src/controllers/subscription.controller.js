import { SubscriptionService } from "../services/subscription.service.js";
export class SubscriptionController {
    static async subscribe(req, res, next) {
        try {
            const storeId = Number(req.query.storeId);
            const planId = Number(req.query.planId);
            const gateway = req.query.gateway || "RAZORPAY";
            const result = await SubscriptionService.subscribeToPlan(storeId, planId, gateway);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async upgrade(req, res, next) {
        try {
            const storeId = Number(req.query.storeId);
            const planId = Number(req.query.planId);
            const gateway = req.query.gateway || "RAZORPAY";
            const result = await SubscriptionService.upgradeSubscription(storeId, planId, gateway);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async activate(req, res, next) {
        try {
            const sub = await SubscriptionService.activateSubscription(Number(req.params.subscriptionId));
            res.status(200).json(sub);
        }
        catch (error) {
            next(error);
        }
    }
    static async cancel(req, res, next) {
        try {
            const sub = await SubscriptionService.cancelSubscription(Number(req.params.subscriptionId));
            res.status(200).json(sub);
        }
        catch (error) {
            next(error);
        }
    }
    static async updatePaymentStatus(req, res, next) {
        try {
            const status = req.query.status;
            const sub = await SubscriptionService.updatePaymentStatus(Number(req.params.subscriptionId), status);
            res.status(200).json(sub);
        }
        catch (error) {
            next(error);
        }
    }
    static async getSubscription(req, res, next) {
        try {
            const sub = await SubscriptionService.getStoreSubscription(Number(req.params.storeId));
            res.status(200).json(sub);
        }
        catch (error) {
            next(error);
        }
    }
    static async listSubscriptions(req, res, next) {
        try {
            const status = req.query.status;
            const subs = await SubscriptionService.getAllSubscriptions(status);
            res.status(200).json(subs);
        }
        catch (error) {
            next(error);
        }
    }
    static async getExpiring(req, res, next) {
        try {
            const days = Number(req.query.days || 7);
            const subs = await SubscriptionService.getExpiringSubscriptions(days);
            res.status(200).json(subs);
        }
        catch (error) {
            next(error);
        }
    }
    static async countByStatus(req, res, next) {
        try {
            const status = req.query.status;
            const count = await SubscriptionService.countByStatus(status);
            res.status(200).json({ count });
        }
        catch (error) {
            next(error);
        }
    }
    static async checkStatus(req, res, next) {
        try {
            const status = await SubscriptionService.checkStatus(Number(req.params.storeId));
            res.status(200).json(status);
        }
        catch (error) {
            next(error);
        }
    }
}
