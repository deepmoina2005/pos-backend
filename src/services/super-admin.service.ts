import { prisma } from "../lib/prisma.js";
import { StoreStatus } from "../generated/client/index.js";

export class SuperAdminService {
  static async getDashboardSummary() {
    const [totalStores, activeStores, pendingStores, blockedStores] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { status: StoreStatus.ACTIVE } }),
      prisma.store.count({ where: { status: StoreStatus.PENDING } }),
      prisma.store.count({ where: { status: StoreStatus.BLOCKED } }),
    ]);

    return {
      totalStores,
      activeStores,
      pendingStores,
      blockedStores,
    };
  }

  static async getStoreRegistrationStats() {
    // Get registrations from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await prisma.store.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grouped[d.toISOString().split('T')[0]] = 0;
    }

    stats.forEach(s => {
      const date = s.createdAt.toISOString().split('T')[0];
      if (grouped[date] !== undefined) {
          grouped[date]++;
      }
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getStoreStatusDistribution() {
    const [active, pending, blocked] = await Promise.all([
      prisma.store.count({ where: { status: StoreStatus.ACTIVE } }),
      prisma.store.count({ where: { status: StoreStatus.PENDING } }),
      prisma.store.count({ where: { status: StoreStatus.BLOCKED } }),
    ]);

    return { active, pending, blocked };
  }

  static async getSubscriptionPlans() {
    return await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
    });
  }

  static async createSubscriptionPlan(data: any) {
    const features = {
      advancedReports: data.advancedReports || data.enableAdvancedReports || false,
      inventory: data.inventory || data.enableInventory || false,
      integrations: data.integrations || data.enableIntegrations || false,
      ecommerce: data.ecommerce || data.enableEcommerce || false,
      invoiceBranding: data.invoiceBranding || data.enableInvoiceBranding || false,
      prioritySupport: data.prioritySupport || false,
      multiLocation: data.multiLocation || data.enableMultiLocation || false,
    };

    return await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        billingCycle: data.billingCycle,
        maxBranches: Number(data.maxBranches ?? data.maxLocations ?? 1),
        maxEmployees: Number(data.maxEmployees ?? data.maxUsers ?? 0),
        maxProducts: data.maxProducts != null ? Number(data.maxProducts) : undefined,
        features: JSON.stringify(features),
        active: data.active !== undefined ? Boolean(data.active) : true,
      },
    });
  }

  static async updateSubscriptionPlan(id: number, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle;
    if (data.maxBranches !== undefined || data.maxLocations !== undefined)
      updateData.maxBranches = Number(data.maxBranches ?? data.maxLocations);
    if (data.maxEmployees !== undefined || data.maxUsers !== undefined)
      updateData.maxEmployees = Number(data.maxEmployees ?? data.maxUsers);
    if (data.maxProducts !== undefined) updateData.maxProducts = Number(data.maxProducts);
    if (data.active !== undefined) updateData.active = Boolean(data.active);

    const featureKeys = [
      'advancedReports', 'enableAdvancedReports',
      'inventory', 'enableInventory',
      'integrations', 'enableIntegrations',
      'ecommerce', 'enableEcommerce',
      'invoiceBranding', 'enableInvoiceBranding',
      'prioritySupport',
      'multiLocation', 'enableMultiLocation'
    ];

    const hasFeatures = featureKeys.some(k => data[k] !== undefined) || data.features !== undefined;

    if (hasFeatures) {
      const currentPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
      const currentFeatures = typeof currentPlan?.features === 'string' ? JSON.parse(currentPlan.features) : {};
      
      const newFeatures = {
        ...currentFeatures,
        advancedReports: data.advancedReports ?? data.enableAdvancedReports ?? currentFeatures.advancedReports,
        inventory: data.inventory ?? data.enableInventory ?? currentFeatures.inventory,
        integrations: data.integrations ?? data.enableIntegrations ?? currentFeatures.integrations,
        ecommerce: data.ecommerce ?? data.enableEcommerce ?? currentFeatures.ecommerce,
        invoiceBranding: data.invoiceBranding ?? data.enableInvoiceBranding ?? currentFeatures.invoiceBranding,
        prioritySupport: data.prioritySupport ?? currentFeatures.prioritySupport,
        multiLocation: data.multiLocation ?? data.enableMultiLocation ?? currentFeatures.multiLocation,
      };
      
      updateData.features = JSON.stringify(newFeatures);
    } else if (data.features !== undefined) {
      updateData.features = JSON.stringify(data.features || {});
    }

    return await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteSubscriptionPlan(id: number) {
    return await prisma.subscriptionPlan.delete({
      where: { id },
    });
  }
}
