import { Request, Response, NextFunction } from "express";
import { RefundService } from "../services/refund.service.js";
import { createRefundSchema } from "../schemas/refund.schema.js";

export class RefundController {
  static async createRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRefundSchema.parse(req.body);
      const cashierId = req.user?.userId;
      
      if (!cashierId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const refund = await RefundService.createRefund(data, cashierId);
      res.status(201).json(refund);
    } catch (error) {
      next(error);
    }
  }

  static async getBranchRefunds(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const branchId = Number(req.params.branchId);

      if (userRole === "BRANCH_CASHIER" && req.user?.userId) {
        const refunds = await RefundService.getRefundsByCashier(req.user.userId);
        return res.status(200).json(refunds);
      }

      const refunds = await RefundService.getRefundsByBranch(branchId);
      res.status(200).json(refunds);
    } catch (error) {
      next(error);
    }
  }

  static async getCashierRefunds(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const requestedId = Number(req.params.cashierId);

      if (userRole === "BRANCH_CASHIER" && requestedId !== req.user?.userId) {
        return res.status(403).json({ message: "You can only view your own refunds" });
      }

      const refunds = await RefundService.getRefundsByCashier(requestedId);
      res.status(200).json(refunds);
    } catch (error) {
      next(error);
    }
  }
}
