import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";

import multer from "multer";

const router = Router();
const upload = multer();

router.use(authenticateToken);
router.use(requireActiveAssignment);

router.post("/", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), InventoryController.updateStock);
router.post("/import", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), upload.single("file"), InventoryController.bulkImportInventory);
router.get("/branch/:branchId", InventoryController.getBranchInventory);
router.get("/product/:productId", InventoryController.getProductInventory);

// New Batch & Expiry Routes
router.get("/batches/branch/:branchId", InventoryController.getBranchBatches);
router.get("/batches/branch/:branchId/product/:productId", InventoryController.getProductBatches);
router.get("/alerts/expiry/:branchId", InventoryController.getExpiryAlerts);

export default router;

