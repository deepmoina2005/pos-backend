import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema.js";
import { normalizeRole } from "../utils/role.util.js";

export class UserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const requesterRole = normalizeRole((req as any).user.role || (req as any).user.authorities?.replace("ROLE_", ""));

      // Restrict Branch Manager: Can only create CASHIER in their own branch
      if (requesterRole === "BRANCH_MANAGER") {
        if (normalizeRole(data.role) !== "CASHIER") {
          return res.status(403).json({ message: "Branch Managers can only create Cashiers" });
        }
        if (data.branchId !== (req as any).user.branchId) {
          return res.status(403).json({ message: "Branch Managers can only create users for their own branch" });
        }
      }

      const user = await UserService.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserProfile((req as any).user.email);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(Number(req.params.id));
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserSchema.parse(req.body);
      const requesterRole = normalizeRole((req as any).user.role || (req as any).user.authorities?.replace("ROLE_", ""));

      // Restrict Branch Manager: Can only update CASHIER in their own branch
      if (requesterRole === "BRANCH_MANAGER") {
        const branchId = (req as any).user.branchId;
        
        if (data.role && normalizeRole(data.role) !== "CASHIER") {
          return res.status(403).json({ message: "Branch Managers can only update to Cashier role" });
        }
        
        // Also ensure they aren't trying to update a user from another branch or a non-cashier
        const targetUser = await UserService.getUserById(Number(req.params.id));
        if (normalizeRole(targetUser.role) !== "CASHIER" || targetUser.branchId !== branchId) {
           return res.status(403).json({ message: "Branch Managers can only manage Cashiers in their own branch" });
        }
        
        // Ensure they aren't trying to move a user to another branch
        if (data.branchId && data.branchId !== branchId) {
           return res.status(403).json({ message: "Branch Managers cannot move users between branches" });
        }
      }

      const user = await UserService.updateUser(Number(req.params.id), data);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterRole = normalizeRole((req as any).user.role || (req as any).user.authorities?.replace("ROLE_", ""));

      if (requesterRole === "BRANCH_MANAGER") {
        const branchId = (req as any).user.branchId;
        const targetUser = await UserService.getUserById(Number(req.params.id));
        
        if (normalizeRole(targetUser.role) !== "CASHIER" || targetUser.branchId !== branchId) {
          return res.status(403).json({ message: "Branch Managers can only delete Cashiers in their own branch" });
        }
      }

      await UserService.deleteUser(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId, branchId, role } = req.query;
      const requesterRole = normalizeRole((req as any).user.role || (req as any).user.authorities?.replace("ROLE_", ""));
      
      let effectiveStoreId = storeId ? Number(storeId) : undefined;
      let effectiveBranchId = branchId ? Number(branchId) : undefined;

      if (requesterRole === "BRANCH_MANAGER") {
        effectiveBranchId = (req as any).user.branchId;
      }

      const users = await UserService.listUsers(
        effectiveStoreId,
        effectiveBranchId,
        role ? (role as any) : undefined
      );
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }
}
