import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";

const router = Router();

router.use(authenticateToken);
router.use(requireActiveAssignment);

router.post("/", authorizeRoles("STORE_ADMIN", "CASHIER"), OrderController.createOrder);
router.get("/branch/:branchId", OrderController.getBranchOrders);
router.get("/today/branch/:branchId", OrderController.getTodayBranchOrders);
router.get("/cashier/:cashierId", OrderController.getCashierOrders);
router.get("/customer/:customerId", OrderController.getCustomerOrders);
router.get("/recent/:branchId", OrderController.getRecentOrders);
router.get("/:id", OrderController.getOrder);

export default router;
