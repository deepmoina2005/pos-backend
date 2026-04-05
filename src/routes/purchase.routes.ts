import { Router } from "express";
import * as PurchaseController from "../controllers/purchase.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { createPurchaseSchema } from "../schemas/purchase.schema.js";

const router = Router();

router.use(authenticateToken);

router.post("/", 
  authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "BRANCH_CASHIER"), 
  validateRequest(createPurchaseSchema),
  PurchaseController.createPurchase
);

router.get("/", 
  PurchaseController.getPurchases
);

export default router;
