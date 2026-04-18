import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireActiveAssignment } from "../middlewares/assignment.middleware.js";
import multer from "multer";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(authenticateToken);
router.use(requireActiveAssignment);
// Products
router.post("/import", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), upload.single("file"), ProductController.importProducts);
router.post("/", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), ProductController.createProduct);
router.get("/:id", ProductController.getProduct);
router.get("/store/:storeId", ProductController.getStoreProducts);
router.get("/store/:storeId/search", ProductController.getStoreProducts);
router.patch("/:id", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), ProductController.updateProduct);
router.delete("/:id", authorizeRoles("STORE_ADMIN", "BRANCH_MANAGER"), ProductController.deleteProduct);
export default router;
