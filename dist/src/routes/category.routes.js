import { Router } from "express";
import { CategoryController } from "../controllers/category.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import multer from "multer";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(authenticateToken);
// Categories
router.post("/import", authorizeRoles("ADMIN", "STORE_ADMIN"), upload.single("file"), CategoryController.importCategories);
router.post("/", authorizeRoles("ADMIN", "STORE_ADMIN"), CategoryController.createCategory);
router.get("/store/:storeId", CategoryController.getCategoriesByStore);
router.put("/:id", authorizeRoles("ADMIN", "STORE_ADMIN"), CategoryController.updateCategory);
router.delete("/:id", authorizeRoles("ADMIN", "STORE_ADMIN"), CategoryController.deleteCategory);
export default router;
