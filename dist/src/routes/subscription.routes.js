import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller.js";
import { SuperAdminController } from "../controllers/super-admin.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authenticateToken);
// Public plans listing — any authenticated user can view plans (e.g. Upgrade page)
router.get("/plans", SuperAdminController.getSubscriptionPlans);
router.post("/subscribe", SubscriptionController.subscribe);
router.post("/upgrade", SubscriptionController.upgrade);
router.put("/:subscriptionId/activate", authorizeRoles("SUPER_ADMIN"), SubscriptionController.activate);
router.put("/:subscriptionId/cancel", authorizeRoles("ADMIN", "STORE_ADMIN"), SubscriptionController.cancel);
router.put("/:subscriptionId/payment-status", authorizeRoles("SUPER_ADMIN"), SubscriptionController.updatePaymentStatus);
router.get("/store/:storeId", SubscriptionController.getSubscription);
router.get("/store/:storeId/status", SubscriptionController.checkStatus);
router.get("/admin", authorizeRoles("SUPER_ADMIN"), SubscriptionController.listSubscriptions);
router.get("/admin/expiring", authorizeRoles("SUPER_ADMIN"), SubscriptionController.getExpiring);
router.get("/admin/count", authorizeRoles("SUPER_ADMIN"), SubscriptionController.countByStatus);
export default router;
