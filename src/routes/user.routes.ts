import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/profile", UserController.getProfile);
router.post("/", authorizeRoles("ADMIN", "STORE_ADMIN", "STORE_MANAGER", "BRANCH_MANAGER"), UserController.createUser);
router.get("/", authorizeRoles("ADMIN", "STORE_ADMIN", "STORE_MANAGER", "BRANCH_MANAGER"), UserController.listUsers);
router.get("/:id", UserController.getUser);
router.put("/:id", authorizeRoles("ADMIN", "STORE_ADMIN", "STORE_MANAGER", "BRANCH_MANAGER"), UserController.updateUser);
router.delete("/:id", authorizeRoles("ADMIN", "STORE_ADMIN"), UserController.deleteUser);

export default router;
