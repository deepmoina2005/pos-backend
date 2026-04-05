import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";
import { CategoryController } from "../controllers/category.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Products
router.post("/import", authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER"), upload.single("file"), ProductController.importProducts);
router.post("/", authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER"), ProductController.createProduct);
router.get("/:id", ProductController.getProduct);
router.get("/store/:storeId", ProductController.getStoreProducts);
router.get("/store/:storeId/search", ProductController.getStoreProducts);
router.patch("/:id", authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER"), ProductController.updateProduct);
router.delete("/:id", authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER"), ProductController.deleteProduct);

export default router;
