import { prisma } from "../lib/prisma.js";
import { withDbRetry } from "../utils/db-utils.js";
import { AnalyticsService } from "./analytics.service.js";

export class PnlService {
  static async getBranchPnl(branchId: number, startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;
    
    const whereOrder: any = { branchId, status: "COMPLETED" };
    const whereRefund: any = { branchId };
    const whereExpense: any = { branchId };

    if (dateFilter) {
      whereOrder.orderDate = dateFilter;
      whereRefund.refundDate = dateFilter;
      whereExpense.date = dateFilter;
    }

    const orders = await withDbRetry(() => prisma.order.findMany({
      where: whereOrder,
      include: { orderItems: true }
    }));

    const refunds = await withDbRetry(() => prisma.refund.aggregate({
      where: whereRefund,
      _sum: { amount: true }
    }));

    const expenses = await withDbRetry(() => prisma.expense.aggregate({
      where: whereExpense,
      _sum: { amount: true }
    }));
    
    const expensesByCategory = await withDbRetry(() => prisma.expense.groupBy({
      by: ['category'],
      where: whereExpense,
      _sum: { amount: true }
    }));

    let totalSales = 0; // pre-refund, pre-tax net sales
    let cogs = 0;
    
    for (const order of orders) {
      totalSales += Math.max(0, order.finalAmount - order.totalTax);
      for (const item of order.orderItems) {
        cogs += (item.costPriceSnapshot * item.quantity);
      }
    }

    const totalRefunds = refunds._sum.amount || 0;
    const totalExpenses = expenses._sum.amount || 0;
    
    const netSales = Math.max(0, totalSales - totalRefunds);
    const grossProfit = netSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      totalSales,
      netSales,
      cogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      totalRefunds,
      expensesByCategory: expensesByCategory.map(e => ({ category: e.category, amount: e._sum.amount || 0 }))
    };
  }

  static async getStorePnl(storeAdminId: number, startDate?: Date, endDate?: Date) {
    const metadata = await AnalyticsService.getStoreMetadata(storeAdminId);
    if (!metadata) throw new Error("Store not found");
    const { branchIds, branches } = metadata;

    const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;
    
    const whereOrder: any = { branchId: { in: branchIds }, status: "COMPLETED" };
    const whereRefund: any = { branchId: { in: branchIds } };
    const whereExpense: any = { branchId: { in: branchIds } };

    if (dateFilter) {
      whereOrder.orderDate = dateFilter;
      whereRefund.refundDate = dateFilter;
      whereExpense.date = dateFilter;
    }

    const orders = await withDbRetry(() => prisma.order.findMany({
      where: whereOrder,
      include: { orderItems: true }
    }));

    const refunds = await withDbRetry(() => prisma.refund.aggregate({
      where: whereRefund,
      _sum: { amount: true }
    }));

    const expenses = await withDbRetry(() => prisma.expense.aggregate({
      where: whereExpense,
      _sum: { amount: true }
    }));

    let totalSales = 0;
    let cogs = 0;
    
    const branchStats: Record<number, { sales: number; cogs: number }> = {};

    for (const order of orders) {
      const saleAmt = Math.max(0, order.finalAmount - order.totalTax);
      totalSales += saleAmt;
      
      let orderCogs = 0;
      for (const item of order.orderItems) {
        orderCogs += (item.costPriceSnapshot * item.quantity);
      }
      cogs += orderCogs;
      
      if (!branchStats[order.branchId]) {
        branchStats[order.branchId] = { sales: 0, cogs: 0 };
      }
      branchStats[order.branchId].sales += saleAmt;
      branchStats[order.branchId].cogs += orderCogs;
    }

    const totalRefunds = refunds._sum.amount || 0;
    const totalExpenses = expenses._sum.amount || 0;
    
    const netSales = Math.max(0, totalSales - totalRefunds);
    const grossProfit = netSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    const branchComparison = branches.map(b => {
      const stats = branchStats[b.id] || { sales: 0, cogs: 0 };
      return {
        branchId: b.id,
        branchName: b.name,
        sales: stats.sales,
        grossProfit: stats.sales - stats.cogs
      };
    });

    return {
      totalSales,
      netSales,
      cogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      totalRefunds,
      branchComparison
    };
  }

  static async getProductProfitability(branchId?: number, storeAdminId?: number, startDate?: Date, endDate?: Date) {
    let branchIds: number[] = [];
    if (storeAdminId) {
      const metadata = await AnalyticsService.getStoreMetadata(storeAdminId);
      if (metadata) {
        branchIds = metadata.branchIds;
      }
    } else if (branchId) {
      branchIds = [branchId];
    }
    
    if (branchIds.length === 0) return [];

    const whereOrder: any = { branchId: { in: branchIds }, status: "COMPLETED" };
    if (startDate && endDate) {
      whereOrder.orderDate = { gte: startDate, lte: endDate };
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { order: whereOrder },
      include: { product: true }
    });

    const pStats: Record<number, { name: string; sku: string; qty: number; revenue: number; cogs: number }> = {};

    for (const item of orderItems) {
      if (!pStats[item.productId]) {
        pStats[item.productId] = {
          name: item.product.name,
          sku: item.product.sku,
          qty: 0,
          revenue: 0,
          cogs: 0
        };
      }
      pStats[item.productId].qty += item.quantity;
      pStats[item.productId].revenue += Math.max(0, item.subtotal - item.gstAmount);
      pStats[item.productId].cogs += (item.costPriceSnapshot * item.quantity);
    }

    return Object.values(pStats).map(p => ({
      ...p,
      profit: p.revenue - p.cogs,
      margin: p.revenue > 0 ? ((p.revenue - p.cogs) / p.revenue) * 100 : 0
    })).sort((a, b) => b.profit - a.profit).slice(0, 50);
  }

  static async getProfitTrend(period: "daily" | "weekly" | "monthly", branchId?: number, storeAdminId?: number, startDate?: Date, endDate?: Date) {
    let branchIds: number[] = [];
    if (storeAdminId) {
      const metadata = await AnalyticsService.getStoreMetadata(storeAdminId);
      if (metadata) {
        branchIds = metadata.branchIds;
      }
    } else if (branchId) {
      branchIds = [branchId];
    }
    
    if (branchIds.length === 0) return [];

    const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;
    
    const whereOrder: any = { branchId: { in: branchIds }, status: "COMPLETED" };
    const whereExpense: any = { branchId: { in: branchIds } };

    if (dateFilter) {
      whereOrder.orderDate = dateFilter;
      whereExpense.date = dateFilter;
    }

    const orders = await prisma.order.findMany({
      where: whereOrder,
      include: { orderItems: true }
    });

    const expenses = await prisma.expense.findMany({
      where: whereExpense
    });

    const trend: Record<string, { revenue: number; cogs: number; expenses: number; profit: number }> = {};

    const getBucket = (date: Date) => {
      const d = new Date(date);
      if (period === "monthly") {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === "weekly") {
        // Simple week bucket: Year-W{weekNum}
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      }
      // default daily
      return d.toISOString().split('T')[0];
    };

    for (const order of orders) {
      const bucket = getBucket(order.orderDate);
      if (!trend[bucket]) {
        trend[bucket] = { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
      }
      const saleAmt = Math.max(0, order.finalAmount - order.totalTax);
      trend[bucket].revenue += saleAmt;
      
      let orderCogs = 0;
      for (const item of order.orderItems) {
        orderCogs += (item.costPriceSnapshot * item.quantity);
      }
      trend[bucket].cogs += orderCogs;
    }

    for (const exp of expenses) {
      // Assuming expense date is 'date' field
      if (!exp.date) continue;
      const bucket = getBucket(exp.date);
      if (!trend[bucket]) {
        trend[bucket] = { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
      }
      trend[bucket].expenses += exp.amount;
    }

    return Object.entries(trend)
      .map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        cogs: stats.cogs,
        expenses: stats.expenses,
        profit: stats.revenue - stats.cogs - stats.expenses
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getBusinessInsights(branchId?: number, storeAdminId?: number, startDate?: Date, endDate?: Date) {
    let branchIds: number[] = [];
    
    if (storeAdminId) {
      const metadata = await AnalyticsService.getStoreMetadata(storeAdminId);
      if (metadata) {
        branchIds = metadata.branchIds;
      }
    } else if (branchId) {
      branchIds = [branchId];
    }

    if (branchIds.length === 0) return null;

    const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;

    // 1. Inventory Valuation (Current State)
    const inventoryValuation = await prisma.inventory.findMany({
      where: { branchId: { in: branchIds } },
      include: {
        product: {
          select: {
            costPrice: true,
            sellingPrice: true,
            mrp: true
          }
        }
      }
    });

    let totalStockCost = 0;
    let totalStockValue = 0; // at selling price
    let totalStockMrp = 0;
    let lowStockCount = 0;

    for (const inv of inventoryValuation) {
      totalStockCost += (inv.quantity * inv.product.costPrice);
      totalStockValue += (inv.quantity * inv.product.sellingPrice);
      totalStockMrp += (inv.quantity * (inv.product.mrp || inv.product.sellingPrice));
      if (inv.quantity <= inv.minimumStockLevel) {
        lowStockCount++;
      }
    }

    // 2. Tax Summary
    const taxSummary = await prisma.orderItem.aggregate({
      where: {
        order: {
          branchId: { in: branchIds },
          status: "COMPLETED",
          ...(dateFilter && { orderDate: dateFilter })
        }
      },
      _sum: {
        gstAmount: true,
        taxableAmount: true
      }
    });

    // 3. Customer Metrics
    const customerMetrics = await prisma.order.aggregate({
      where: {
        branchId: { in: branchIds },
        status: "COMPLETED",
        ...(dateFilter && { orderDate: dateFilter })
      },
      _count: {
        id: true,
        customerId: true
      },
      _avg: {
        finalAmount: true
      }
    });

    // Unique customers
    const uniqueCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        branchId: { in: branchIds },
        status: "COMPLETED",
        customerId: { not: null },
        ...(dateFilter && { orderDate: dateFilter })
      }
    });

    return {
      inventory: {
        totalCost: totalStockCost,
        totalValue: totalStockValue,
        totalMrp: totalStockMrp,
        potentialProfit: totalStockValue - totalStockCost,
        lowStockAlerts: lowStockCount
      },
      tax: {
        totalGst: taxSummary._sum.gstAmount || 0,
        taxableSales: taxSummary._sum.taxableAmount || 0
      },
      customers: {
        totalOrders: customerMetrics._count.id,
        uniqueCustomers: uniqueCustomers.length,
        averageOrderValue: customerMetrics._avg.finalAmount || 0
      }
    };
  }
}
