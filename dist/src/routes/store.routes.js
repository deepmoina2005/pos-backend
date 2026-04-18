import { Router } from "express";
import { StoreController } from "../controllers/store.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";
const router = Router();
// Protected routes
router.use(authenticateToken);
router.post("/", authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"), StoreController.createStore);
router.get("/", authorizeRoles("SUPER_ADMIN"), StoreController.getAllStores);
router.get("/admin", authorizeRoles("STORE_ADMIN", "SUPER_ADMIN"), StoreController.getStoreByAdmin);
router.get("/employee", StoreController.getStoreByEmployee);
router.use(requireActiveAssignment);
router.get("/:id", StoreController.getStore);
router.put("/:id/moderate", authorizeRoles("SUPER_ADMIN"), StoreController.moderateStore);
router.put("/:id", authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"), StoreController.updateStore);
router.delete("/:id", authorizeRoles("SUPER_ADMIN"), StoreController.deleteStore);
export default router;
