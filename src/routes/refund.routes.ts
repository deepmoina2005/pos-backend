import { Router } from "express";
import { RefundController } from "../controllers/refund.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";

const router = Router();

router.use(authenticateToken);
router.use(requireActiveAssignment);

router.post("/", authorizeRoles("CASHIER", "STORE_ADMIN"), RefundController.createRefund);
router.get("/branch/:branchId", RefundController.getBranchRefunds);
router.get("/cashier/:cashierId", RefundController.getCashierRefunds);

export default router;

