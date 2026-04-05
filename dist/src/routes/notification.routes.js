import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authenticateToken);
router.get("/", NotificationController.getNotifications);
router.put("/mark-all-read", NotificationController.markAllAsRead);
router.put("/:id/read", NotificationController.markAsRead);
export default router;
