import { Router } from "express";
import * as SupplierController from "../controllers/supplier.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { createSupplierSchema, updateSupplierSchema } from "../schemas/supplier.schema.js";

const router = Router();

router.use(authenticateToken);
router.use(requireActiveAssignment);

router.post("/", 
  authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), 
  validateRequest(createSupplierSchema),
  SupplierController.createSupplier
);

router.get("/", 
  SupplierController.getSuppliers
);

router.patch("/:id", 
  authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), 
  validateRequest(updateSupplierSchema),
  SupplierController.updateSupplier
);

router.delete("/:id", 
  authorizeRoles("STORE_ADMIN"), 
  SupplierController.deleteSupplier
);

export default router;

