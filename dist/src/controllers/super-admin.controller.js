import { SuperAdminService } from "../services/super-admin.service.js";
export class SuperAdminController {
    static async getSummary(req, res, next) {
        try {
            const summary = await SuperAdminService.getDashboardSummary();
            res.status(200).json(summary);
        }
        catch (error) {
            next(error);
        }
    }
    static async getRegistrationStats(req, res, next) {
        try {
            const stats = await SuperAdminService.getStoreRegistrationStats();
            res.status(200).json(stats);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStatusDistribution(req, res, next) {
        try {
            const dist = await SuperAdminService.getStoreStatusDistribution();
            res.status(200).json(dist);
        }
        catch (error) {
            next(error);
        }
    }
    static async getSubscriptionPlans(req, res, next) {
        try {
            const plans = await SuperAdminService.getSubscriptionPlans();
            res.status(200).json(plans);
        }
        catch (error) {
            next(error);
        }
    }
    static async createSubscriptionPlan(req, res, next) {
        try {
            const plan = await SuperAdminService.createSubscriptionPlan(req.body);
            res.status(201).json(plan);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateSubscriptionPlan(req, res, next) {
        try {
            const plan = await SuperAdminService.updateSubscriptionPlan(Number(req.params.id), req.body);
            res.status(200).json(plan);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteSubscriptionPlan(req, res, next) {
        try {
            await SuperAdminService.deleteSubscriptionPlan(Number(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
