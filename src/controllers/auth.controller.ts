import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { 
  signupSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  emailOtpSchema,
  verifyEmailOtpSchema,
  verifyResetTokenSchema
} from "../schemas/auth.schema.js";

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const data = signupSchema.parse(req.body);
      const user = await AuthService.signup(data);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("[Auth] Login attempt:", req.body);
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      console.log("[Auth] Login successful for:", data.email);
      res.status(200).json(result);
    } catch (error) {
      console.error("[Auth] Login error:", error);
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.forgotPassword(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async sendEmailOTP(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("[AuthController.sendEmailOTP] request received");
      const data = emailOtpSchema.parse(req.body);
      const result = await AuthService.sendEmailOTP(data);
      console.log("[AuthController.sendEmailOTP] response success");
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyResetTokenSchema.parse(req.body);
      const result = await AuthService.verifyResetToken(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmailOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyEmailOtpSchema.parse(req.body);
      const result = await AuthService.verifyEmailOTP(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
