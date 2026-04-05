import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
export class SubscriptionPlanService {
    static async createPlan(data) {
        return await prisma.subscriptionPlan.create({ data });
    }
    static async getAllPlans() {
        return await prisma.subscriptionPlan.findMany();
    }
    static async getPlanById(id) {
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
        if (!plan)
            throw new ResourceNotFoundError("SubscriptionPlan", id);
        return plan;
    }
}
