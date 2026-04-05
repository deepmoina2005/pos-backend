import { Request, Response, NextFunction } from "express";
import { ShiftReportService } from "../services/shift.service.js";
import { startShiftSchema } from "../schemas/shift.schema.js";

export class ShiftReportController {
  static async startShift(req: Request, res: Response, next: NextFunction) {
    try {
      const { openingBalance } = startShiftSchema.parse(req.body);
      const cashierId = req.user?.userId;
      
      if (!cashierId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const report = await ShiftReportService.startShift(cashierId, openingBalance);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }

  static async endShift(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id ? Number(req.params.id) : undefined;
      const cashierId = req.user?.userId;
      const report = await ShiftReportService.endShift(id, cashierId);
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentShift(req: Request, res: Response, next: NextFunction) {
    try {
      const cashierId = req.user?.userId;
      if (!cashierId) return res.status(401).json({ message: "Not authenticated" });
      const report = await ShiftReportService.getCurrentShift(cashierId);
      res.status(200).json(report || {});
    } catch (error) {
      next(error);
    }
  }

  static async getShift(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ShiftReportService.getShiftById(Number(req.params.id));
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  }

  static async getCashierShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ShiftReportService.getCashierShifts(Number(req.params.cashierId));
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  static async getBranchShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const branchId = Number(req.params.branchId);

      if (userRole === "BRANCH_CASHIER" && req.user?.userId) {
        // Enforce isolation for cashiers
        const reports = await ShiftReportService.getCashierShifts(req.user.userId);
        return res.status(200).json(reports);
      }

      const reports = await ShiftReportService.getShiftsByBranch(branchId);
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  static async listAllShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      
      if (userRole === "BRANCH_CASHIER" && req.user?.userId) {
        const reports = await ShiftReportService.getCashierShifts(req.user.userId);
        return res.status(200).json(reports);
      }

      const reports = await ShiftReportService.getAllShifts();
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  static async deleteShift(req: Request, res: Response, next: NextFunction) {
    try {
      await ShiftReportService.deleteShift(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getShiftByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const cashierId = Number(req.params.cashierId);
      const date = new Date(req.query.date as string);
      const report = await ShiftReportService.getShiftReportByDate(cashierId, date);
      res.status(200).json(report || {});
    } catch (error) {
      next(error);
    }
  }
}
