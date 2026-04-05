import { prisma } from "../lib/prisma.js";

export class AnalyticsService {
  // --- Branch Analytics ---

  static async getBranchOverview(branchId: number, cashierId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        branchId,
        cashierId: cashierId || undefined,
        orderDate: { gte: today }
      }
    });

    const totalSales = orders.reduce((sum, o) => sum + o.finalAmount, 0);
    const orderCount = orders.length;

    // Get active cashiers today (if restricted to one cashier, this is always 1 or 0)
    const activeCashiers = cashierId ? (orders.length > 0 ? 1 : 0) : new Set(orders.map(o => o.cashierId)).size;

    // Get low stock items for this branch's store (Shared data, typically visible to all)
    const branch = await prisma.branch.findUnique({ 
      where: { id: branchId },
      select: { storeId: true }
    });
    
    const lowStockItems = await prisma.inventory.count({
      where: {
        branchId,
        quantity: { lte: 10 } 
      }
    });

    // Get branch-specific lifetime stats
    const totalEmployees = await prisma.user.count({ where: { branchId } });
    
    // Total products and categories are store-wide
    const totalProducts = branch?.storeId ? await prisma.product.count({ where: { storeId: branch.storeId } }) : 0;
    const totalCategories = branch?.storeId ? await prisma.category.count({ where: { storeId: branch.storeId } }) : 0;
    
    // Total customers (unique customers who ordered at this branch [optionally by this cashier])
    const totalCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      where: { 
        branchId,
        cashierId: cashierId || undefined
      },
    }).then(groups => groups.length);

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { 
        order: { 
          branchId,
          cashierId: cashierId || undefined
        } 
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    // Populate product names
    const populatedProducts = await Promise.all(topProducts.map(async (p) => {
      const product = await prisma.product.findUnique({ where: { id: p.productId } });
      return {
        productName: product?.name || 'Unknown',
        quantitySold: p._sum.quantity,
        totalRevenue: p._sum.subtotal,
        percentage: totalSales > 0 ? (p._sum.subtotal! / totalSales) * 100 : 0
      };
    }));

    return {
      totalSales,
      ordersToday: orderCount,
      activeCashiers,
      lowStockItems,
      totalProducts,
      totalCategories,
      totalEmployees,
      totalCustomers,
      salesGrowth: 12.5,
      orderGrowth: 5.2,
      cashierGrowth: 0,
      lowStockGrowth: -2.1,
      topProducts: populatedProducts
    };
  }

  static async getCategorySales(branchId: number, cashierId?: number) {
    const orderItems = await prisma.orderItem.findMany({
      where: { 
        order: { 
          branchId,
          cashierId: cashierId || undefined
        } 
      },
      include: { product: { include: { category: true } } }
    });

    const categoryStats: Record<string, number> = {};
    orderItems.forEach(item => {
      const categoryName = item.product.category?.name || "Uncategorized";
      categoryStats[categoryName] = (categoryStats[categoryName] || 0) + item.subtotal;
    });

    return Object.entries(categoryStats).map(([name, value]) => ({ name, value }));
  }

  static async getDailySalesChart(branchId: number, days: number, cashierId?: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sales = await prisma.order.findMany({
      where: { 
        branchId, 
        cashierId: cashierId || undefined,
        orderDate: { gte: startDate } 
      },
      select: { orderDate: true, finalAmount: true },
    });

    const dailySales: Record<string, number> = {};
    sales.forEach(s => {
      const dateKey = s.orderDate.toISOString().split("T")[0];
      dailySales[dateKey] = (dailySales[dateKey] || 0) + s.finalAmount;
    });

    return Object.entries(dailySales).map(([date, amount]) => ({ date, amount }));
  }

  static async getTopCashiers(branchId: number) {
    const cashiers = await prisma.order.groupBy({
      by: ["cashierId"],
      where: { branchId },
      _sum: { finalAmount: true },
      orderBy: { _sum: { finalAmount: "desc" } },
      take: 5,
    });

    const populatedCashiers = await Promise.all(cashiers.map(async (c) => {
      const user = await prisma.user.findUnique({ where: { id: c.cashierId } });
      return {
        name: user?.fullName || "Unknown",
        revenue: c._sum.finalAmount || 0,
      };
    }));

    return populatedCashiers;
  }

  static async getPaymentBreakdown(branchId: number, date?: Date, cashierId?: number) {
    const whereClause: any = { branchId };
    if (cashierId) whereClause.cashierId = cashierId;
    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      whereClause.orderDate = { gte: start, lte: end };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: { paymentType: true, finalAmount: true },
    });

    const breakdown: Record<string, { totalAmount: number, count: number }> = {};
    let totalAll = 0;
    
    orders.forEach(o => {
      if (!breakdown[o.paymentType]) {
        breakdown[o.paymentType] = { totalAmount: 0, count: 0 };
      }
      breakdown[o.paymentType].totalAmount += o.finalAmount;
      breakdown[o.paymentType].count += 1;
      totalAll += o.finalAmount;
    });

    return Object.entries(breakdown).map(([type, stats]) => ({
      type,
      totalAmount: stats.totalAmount,
      transactionCount: stats.count,
      percentage: totalAll > 0 ? (stats.totalAmount / totalAll) * 100 : 0
    }));
  }

  // --- Store Analytics ---

  static async getStoreOverview(storeAdminId: number) {
    const store = await prisma.store.findFirst({ where: { storeAdminId } });
    if (!store) return null;

    const branches = await prisma.branch.findMany({ where: { storeId: store.id } });
    const branchIds = branches.map(b => b.id);

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    // Stats for Today
    const todayOrdersData = await prisma.order.aggregate({
      where: { 
        branchId: { in: branchIds },
        orderDate: { gte: today }
      },
      _count: { id: true },
      _sum: { finalAmount: true }
    });

    // Stats for Yesterday
    const yesterdayOrdersData = await prisma.order.aggregate({
      where: { 
        branchId: { in: branchIds },
        orderDate: { gte: yesterday, lt: today }
      },
      _count: { id: true }
    });

    // Active Cashiers Today
    const activeCashiersToday = await prisma.order.groupBy({
      by: ['cashierId'],
      where: { 
        branchId: { in: branchIds },
        orderDate: { gte: today }
      }
    });

    // Total Sales and Orders (All Time)
    const totalStats = await prisma.order.aggregate({
      where: { branchId: { in: branchIds } },
      _sum: { finalAmount: true },
      _count: { id: true }
    });

    // Previous Period Sales and Orders (Last 30-60 days)
    const previousPeriodStats = await prisma.order.aggregate({
      where: { 
        branchId: { in: branchIds },
        orderDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      },
      _sum: { finalAmount: true },
      _count: { id: true }
    });

    const totalSales = totalStats._sum.finalAmount || 0;
    const totalOrders = totalStats._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const previousPeriodSales = previousPeriodStats._sum.finalAmount || 0;
    const previousPeriodOrders = previousPeriodStats._count.id || 0;
    const previousPeriodAverageOrderValue = previousPeriodOrders > 0 ? previousPeriodSales / previousPeriodOrders : 0;

    const totalProducts = await prisma.product.count({ where: { storeId: store.id } });
    const totalEmployees = await prisma.user.count({
      where: {
        role: { in: ['BRANCH_MANAGER', 'BRANCH_CASHIER'] },
        branchId: { in: branchIds }
      }
    });

    return {
      totalSales,
      totalBranches: branches.length,
      totalProducts,
      totalEmployees,
      todayOrders: todayOrdersData._count.id || 0,
      yesterdayOrders: yesterdayOrdersData._count.id || 0,
      activeCashiers: activeCashiersToday.length,
      averageOrderValue,
      previousPeriodSales,
      previousPeriodAverageOrderValue,
      previousPeriodBranches: branches.length,
      previousPeriodProducts: totalProducts,
      previousPeriodEmployees: totalEmployees
    };
  }

  static async getStoreRecentSales(storeAdminId: number) {
    const store = await prisma.store.findFirst({ where: { storeAdminId } });
    if (!store) return [];

    const branches = await prisma.branch.findMany({ where: { storeId: store.id } });
    const branchIds = branches.map(b => b.id);

    const recentOrders = await prisma.order.findMany({
      where: { branchId: { in: branchIds } },
      include: {
        branch: { select: { name: true } },
        customer: { select: { name: true } }
      },
      orderBy: { orderDate: 'desc' },
      take: 10
    });

    return recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      branchName: order.branch.name,
      customerName: order.customer?.name || "Walk-in Customer",
      amount: order.finalAmount,
      date: order.orderDate,
      status: order.status
    }));
  }

  static async getStoreSalesTrends(storeAdminId: number, period: string = 'daily') {
    const store = await prisma.store.findFirst({ where: { storeAdminId } });
    if (!store) return [];

    const sales = await prisma.order.findMany({
      where: { branch: { storeId: store.id } },
      select: { orderDate: true, finalAmount: true },
      orderBy: { orderDate: 'asc' }
    });

    const trends: Record<string, number> = {};
    sales.forEach(sale => {
      let dateKey: string;
      if (period === 'monthly') {
        dateKey = sale.orderDate.toISOString().slice(0, 7); // YYYY-MM
      } else {
        dateKey = sale.orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      trends[dateKey] = (trends[dateKey] || 0) + sale.finalAmount;
    });

    return Object.entries(trends).map(([date, sales]) => ({ date, sales }));
  }

  static async getStoreSalesByInterval(storeAdminId: number, interval: 'daily' | 'monthly') {
    return this.getStoreSalesTrends(storeAdminId, interval);
  }

  static async getStoreSalesByCategory(storeAdminId: number) {
    const store = await prisma.store.findFirst({ where: { storeAdminId } });
    if (!store) return [];

    const orderItems = await prisma.orderItem.findMany({
      where: { order: { branch: { storeId: store.id } } },
      include: { product: { include: { category: true } } }
    });

    const categoryStats: Record<string, number> = {};
    orderItems.forEach(item => {
      const categoryName = item.product.category?.name || "Uncategorized";
      categoryStats[categoryName] = (categoryStats[categoryName] || 0) + item.subtotal;
    });

    return Object.entries(categoryStats).map(([name, value]) => ({ name, value }));
  }

  static async getStoreSalesByPaymentMethod(storeAdminId: number) {
    const store = await prisma.store.findFirst({ where: { storeAdminId } });
    if (!store) return [];

    const orders = await prisma.order.findMany({
      where: { branch: { storeId: store.id } },
      select: { paymentType: true, finalAmount: true },
    });

    const breakdown: Record<string, number> = {};
    orders.forEach(o => {
      breakdown[o.paymentType] = (breakdown[o.paymentType] || 0) + o.finalAmount;
    });

    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }

  static async getStoreSalesByBranch(storeAdminId: number) {
    const store = await prisma.store.findFirst({ where: { storeAdminId } });
    if (!store) return [];

    const branchSales = await prisma.order.groupBy({
      by: ['branchId'],
      where: { branch: { storeId: store.id } },
      _sum: { finalAmount: true }
    });

    return Promise.all(branchSales.map(async (b) => {
      const branch = await prisma.branch.findUnique({ where: { id: b.branchId } });
      return {
        name: branch?.name || 'Unknown',
        value: b._sum.finalAmount || 0
      };
    }));
  }

  static async getStorePaymentBreakdown(storeAdminId: number) {
    return this.getStoreSalesByPaymentMethod(storeAdminId);
  }

  static async getStoreBranchPerformance(storeAdminId: number) {
    const store = await prisma.store.findFirst({ where: { storeAdminId } });
    if (!store) return [];

    const branches = await prisma.branch.findMany({ where: { storeId: store.id } });
    
    return Promise.all(branches.map(async (b) => {
      const sales = await prisma.order.aggregate({
        where: { branchId: b.id },
        _sum: { finalAmount: true },
        _count: { id: true }
      });
      return {
        branchName: b.name,
        totalSales: sales._sum.finalAmount || 0,
        orderCount: sales._count.id
      };
    }));
  }

  static async getStoreAlerts(storeAdminId: number) {
    return [
      { id: 1, type: 'LOW_STOCK', message: '5 products are low in stock', severity: 'WARNING' },
      { id: 2, type: 'SUBSCRIPTION', message: 'Subscription expires in 5 days', severity: 'INFO' }
    ];
  }
}
