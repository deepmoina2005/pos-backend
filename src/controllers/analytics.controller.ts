import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service.js";
import { PnlService } from "../services/pnl.service.js";

export class BranchAnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId);
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const cashierId = userRole === "BRANCH_CASHIER" ? req.user?.userId : undefined;

      const stats = await AnalyticsService.getBranchOverview(branchId, cashierId);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getCategorySales(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId);
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const cashierId = userRole === "BRANCH_CASHIER" ? req.user?.userId : undefined;

      const stats = await AnalyticsService.getCategorySales(branchId, cashierId);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getDailySalesChart(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId);
      const days = Number(req.query.days || 7);
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const cashierId = userRole === "BRANCH_CASHIER" ? req.user?.userId : undefined;

      const stats = await AnalyticsService.getDailySalesChart(branchId, days, cashierId);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId);
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const cashierId = userRole === "BRANCH_CASHIER" ? req.user?.userId : undefined;

      const { topProducts } = await AnalyticsService.getBranchOverview(branchId, cashierId);
      res.status(200).json(topProducts);
    } catch (error) {
      next(error);
    }
  }

  static async getTopCashiers(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId);
      const userRole = req.user?.authorities?.replace("ROLE_", "");

      // Cashiers shouldn't see top cashiers list (competitive/private data)
      if (userRole === "BRANCH_CASHIER") {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await AnalyticsService.getTopCashiers(branchId);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const cashierId = userRole === "BRANCH_CASHIER" ? req.user?.userId : undefined;

      const stats = await AnalyticsService.getPaymentBreakdown(branchId, date, cashierId);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getPnl(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId);
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const pnl = await PnlService.getBranchPnl(branchId, start, end);
      res.status(200).json(pnl);
    } catch (error) {
      next(error);
    }
  }

  static async getProductProfitability(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId);
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await PnlService.getProductProfitability(branchId, undefined, start, end);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getProfitTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId);
      const period = (req.query.period as "daily" | "weekly" | "monthly") || "daily";
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await PnlService.getProfitTrend(period, branchId, undefined, start, end);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId);
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const insights = await PnlService.getBusinessInsights(branchId, undefined, start, end);
      res.status(200).json(insights);
    } catch (error) {
      next(error);
    }
  }
}

export class StoreAnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreOverview(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getSalesTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'daily';
      const stats = await AnalyticsService.getStoreSalesTrends(Number(req.params.storeAdminId), period);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlySales(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreSalesByInterval(Number(req.params.storeAdminId), 'monthly');
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getDailySales(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreSalesByInterval(Number(req.params.storeAdminId), 'daily');
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getSalesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreSalesByCategory(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getSalesByPaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreSalesByPaymentMethod(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getSalesByBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreSalesByBranch(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStorePaymentBreakdown(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getBranchPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreBranchPerformance(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getStoreAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreAlerts(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getRecentSales(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getStoreRecentSales(Number(req.params.storeAdminId));
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getPnl(req: Request, res: Response, next: NextFunction) {
    try {
      const storeAdminId = Number(req.params.storeAdminId);
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const pnl = await PnlService.getStorePnl(storeAdminId, start, end);
      res.status(200).json(pnl);
    } catch (error) {
      next(error);
    }
  }

  static async getProductProfitability(req: Request, res: Response, next: NextFunction) {
    try {
      const storeAdminId = Number(req.params.storeAdminId);
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await PnlService.getProductProfitability(undefined, storeAdminId, start, end);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getProfitTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const storeAdminId = Number(req.params.storeAdminId);
      const period = (req.query.period as "daily" | "weekly" | "monthly") || "daily";
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await PnlService.getProfitTrend(period, undefined, storeAdminId, start, end);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const storeAdminId = Number(req.params.storeAdminId);
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const insights = await PnlService.getBusinessInsights(undefined, storeAdminId, start, end);
      res.status(200).json(insights);
    } catch (error) {
      next(error);
    }
  }
}
