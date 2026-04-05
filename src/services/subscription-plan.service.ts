import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
import { BillingCycle } from "../generated/client/index.js";

export class SubscriptionPlanService {
  static async createPlan(data: {
    name: string;
    price: number;
    billingCycle: BillingCycle;
    maxBranches: number;
    maxEmployees: number;
    features: string;
  }) {
    return await prisma.subscriptionPlan.create({ data });
  }

  static async getAllPlans() {
    return await prisma.subscriptionPlan.findMany();
  }

  static async getPlanById(id: number) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new ResourceNotFoundError("SubscriptionPlan", id);
    return plan;
  }
}
