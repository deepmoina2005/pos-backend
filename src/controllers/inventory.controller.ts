import { Request, Response, NextFunction } from "express";
import { InventoryService } from "../services/inventory.service.js";
import { updateInventorySchema } from "../schemas/product.schema.js";

export class InventoryController {
  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, productId } = req.body; // or from params depending on frontend flow
      const data = updateInventorySchema.parse(req.body);
      const inventory = await InventoryService.updateStock(Number(branchId), Number(productId), data);
      res.status(200).json(inventory);
    } catch (error) {
      next(error);
    }
  }

  static async getBranchInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await InventoryService.getInventoryByBranch(Number(req.params.branchId));
      res.status(200).json(inventory);
    } catch (error) {
      next(error);
    }
  }

  static async getProductInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await InventoryService.getInventoryByProduct(Number(req.params.productId));
      res.status(200).json(inventory);
    } catch (error) {
      next(error);
    }
  }

  static async bulkImportInventory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { branchId } = req.body;
      if (!branchId) {
        return res.status(400).json({ message: "branchId is required" });
      }

      const results = await InventoryService.bulkImportInventory(Number(branchId), req.file.buffer);
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }
  static async getBranchBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const batches = await InventoryService.getInventoryBatchesByBranch(Number(req.params.branchId));
      res.status(200).json(batches);
    } catch (error) {
      next(error);
    }
  }

  static async getProductBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, productId } = req.params;
      const batches = await InventoryService.getInventoryBatchesByProduct(Number(branchId), Number(productId));
      res.status(200).json(batches);
    } catch (error) {
      next(error);
    }
  }

  static async getExpiryAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await InventoryService.getExpiryAlertsByBranch(Number(req.params.branchId));
      res.status(200).json(alerts);
    } catch (error) {
      next(error);
    }
  }
}
