import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/send-otp", AuthController.sendEmailOTP);
router.post("/verify-otp", AuthController.verifyEmailOTP);
router.post("/verify-reset-token", AuthController.verifyResetToken);

export default router;
