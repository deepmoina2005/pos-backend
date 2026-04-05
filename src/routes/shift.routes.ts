import { Router } from "express";
import { ShiftReportController } from "../controllers/shift.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/start", authorizeRoles("BRANCH_CASHIER", "ADMIN", "SUPER_ADMIN"), ShiftReportController.startShift);
router.patch("/end", authorizeRoles("BRANCH_CASHIER", "ADMIN", "SUPER_ADMIN"), ShiftReportController.endShift);
router.patch("/:id/end", authorizeRoles("BRANCH_CASHIER", "ADMIN", "SUPER_ADMIN"), ShiftReportController.endShift);

router.get("/current", ShiftReportController.getCurrentShift);
router.get("/:id", ShiftReportController.getShift);
router.get("/", authorizeRoles("SUPER_ADMIN"), ShiftReportController.listAllShifts);
router.get("/branch/:branchId", authorizeRoles("SUPER_ADMIN", "ADMIN", "STORE_ADMIN"), ShiftReportController.getBranchShifts);
router.get("/cashier/:cashierId", ShiftReportController.getCashierShifts);
router.get("/cashier/:cashierId/by-date", ShiftReportController.getShiftByDate);

router.delete("/:id", authorizeRoles("SUPER_ADMIN"), ShiftReportController.deleteShift);

export default router;
