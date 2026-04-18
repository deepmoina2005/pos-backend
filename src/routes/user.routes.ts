import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/profile", UserController.getProfile);
router.use(requireActiveAssignment);
router.post("/", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), UserController.createUser);
router.get("/", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), UserController.listUsers);
router.get("/:id", UserController.getUser);
router.put("/:id", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), UserController.updateUser);
router.delete("/:id", authorizeRoles("STORE_ADMIN"), UserController.deleteUser);

export default router;

