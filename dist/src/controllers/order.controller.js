import { OrderService } from "../services/order.service.js";
import { createOrderSchema } from "../schemas/order.schema.js";
export class OrderController {
    static async createOrder(req, res, next) {
        try {
            const data = createOrderSchema.parse(req.body);
            const cashierId = req.user?.userId; // Set by authenticateToken middleware
            if (!cashierId) {
                return res.status(401).json({ message: "User ID not found in token" });
            }
            const order = await OrderService.createOrder(data, cashierId);
            res.status(201).json(order);
        }
        catch (error) {
            next(error);
        }
    }
    static async getOrder(req, res, next) {
        try {
            const order = await OrderService.getOrderById(Number(req.params.id));
            res.status(200).json(order);
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranchOrders(req, res, next) {
        try {
            const { cashierId: queryCashierId, paymentType, status } = req.query;
            const userRole = req.user?.role || req.user?.authorities?.replace("ROLE_", "");
            // If user is a cashier, they can ONLY see their own orders
            const enforcedCashierId = userRole === "CASHIER" ? req.user?.userId : (queryCashierId ? Number(queryCashierId) : undefined);
            const filters = {
                cashierId: enforcedCashierId,
                paymentType: paymentType,
                status: status,
            };
            const orders = await OrderService.getOrdersByBranch(Number(req.params.branchId), undefined, filters);
            res.status(200).json(orders);
        }
        catch (error) {
            next(error);
        }
    }
    static async getTodayBranchOrders(req, res, next) {
        try {
            const userRole = req.user?.role || req.user?.authorities?.replace("ROLE_", "");
            const branchId = Number(req.params.branchId);
            if (userRole === "CASHIER" && req.user?.userId) {
                // Restricted to cashier's own orders for today
                const orders = await OrderService.getOrdersByCashier(req.user.userId);
                // Filter by today's date if necessary, or let client handle if service handles it
                // Actually OrderService.getTodayOrdersByBranch is more efficient, let's just use it with filters if it supported them
                // Re-fetching manually to match expected behavior
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const filtered = orders.filter(o => new Date(o.orderDate) >= today);
                return res.status(200).json(filtered);
            }
            const orders = await OrderService.getTodayOrdersByBranch(branchId);
            res.status(200).json(orders);
        }
        catch (error) {
            next(error);
        }
    }
    static async getCashierOrders(req, res, next) {
        try {
            const userRole = req.user?.role || req.user?.authorities?.replace("ROLE_", "");
            const requestedId = Number(req.params.cashierId);
            // Security Check: Cashier can only request their own ID
            if (userRole === "CASHIER" && requestedId !== req.user?.userId) {
                return res.status(403).json({ message: "You can only view your own order history" });
            }
            const orders = await OrderService.getOrdersByCashier(requestedId);
            res.status(200).json(orders);
        }
        catch (error) {
            next(error);
        }
    }
    static async getCustomerOrders(req, res, next) {
        try {
            const orders = await OrderService.getOrdersByCustomer(Number(req.params.customerId));
            res.status(200).json(orders);
        }
        catch (error) {
            next(error);
        }
    }
    static async getRecentOrders(req, res, next) {
        try {
            const branchId = Number(req.params.branchId);
            const userRole = req.user?.role || req.user?.authorities?.replace("ROLE_", "");
            const filters = {
                cashierId: userRole === "CASHIER" ? req.user?.userId : undefined
            };
            const orders = await OrderService.getOrdersByBranch(branchId, 5, filters);
            res.status(200).json(orders);
        }
        catch (error) {
            next(error);
        }
    }
}
