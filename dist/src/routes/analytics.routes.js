import { Router } from "express";
import { BranchAnalyticsController, StoreAnalyticsController } from "../controllers/analytics.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authenticateToken);
// Branch Analytics (Standardized to match frontend thunks)
router.get("/today-overview", BranchAnalyticsController.getOverview);
router.get("/category-sales", BranchAnalyticsController.getCategorySales);
router.get("/daily-sales", BranchAnalyticsController.getDailySalesChart);
router.get("/top-products", BranchAnalyticsController.getTopProducts);
router.get("/top-cashiers", BranchAnalyticsController.getTopCashiers);
router.get("/payment-breakdown", BranchAnalyticsController.getPaymentBreakdown);
// Legacy/Compatibility Branch Analytics
router.get("/branch/:branchId/overview", BranchAnalyticsController.getOverview);
router.get("/branch/:branchId/category-sales", BranchAnalyticsController.getCategorySales);
router.get("/branch/:branchId/pnl", BranchAnalyticsController.getPnl);
router.get("/branch/:branchId/product-profitability", BranchAnalyticsController.getProductProfitability);
router.get("/branch/:branchId/profit-trend", BranchAnalyticsController.getProfitTrend);
router.get("/branch/:branchId/business-insights", BranchAnalyticsController.getBusinessInsights);
// Store Analytics
router.get("/:storeAdminId/overview", StoreAnalyticsController.getOverview);
router.get("/:storeAdminId/sales-trends", StoreAnalyticsController.getSalesTrends);
router.get("/:storeAdminId/sales/monthly", StoreAnalyticsController.getMonthlySales);
router.get("/:storeAdminId/sales/daily", StoreAnalyticsController.getDailySales);
router.get("/:storeAdminId/sales/category", StoreAnalyticsController.getSalesByCategory);
router.get("/:storeAdminId/sales/payment-method", StoreAnalyticsController.getSalesByPaymentMethod);
router.get("/:storeAdminId/sales/branch", StoreAnalyticsController.getSalesByBranch);
router.get("/:storeAdminId/payments", StoreAnalyticsController.getPaymentBreakdown);
router.get("/:storeAdminId/branch-performance", StoreAnalyticsController.getBranchPerformance);
router.get("/:storeAdminId/recent-sales", StoreAnalyticsController.getRecentSales);
router.get("/:storeAdminId/alerts", StoreAnalyticsController.getStoreAlerts);
router.get("/:storeAdminId/pnl", StoreAnalyticsController.getPnl);
router.get("/:storeAdminId/product-profitability", StoreAnalyticsController.getProductProfitability);
router.get("/:storeAdminId/profit-trend", StoreAnalyticsController.getProfitTrend);
router.get("/:storeAdminId/business-insights", StoreAnalyticsController.getBusinessInsights);
export default router;
