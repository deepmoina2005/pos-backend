import { Router } from "express";
import { BranchController } from "../controllers/branch.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";

const router = Router();

router.use(authenticateToken);
router.use(requireActiveAssignment);

router.post("/", authorizeRoles("STORE_ADMIN"), BranchController.createBranch);
router.get("/:id", BranchController.getBranch);
router.get("/store/:storeId", BranchController.getBranchesByStore);
router.put("/:id", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), BranchController.updateBranch);
router.delete("/:id", authorizeRoles("STORE_ADMIN"), BranchController.deleteBranch);

export default router;

