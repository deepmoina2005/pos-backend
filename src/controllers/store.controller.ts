import { Request, Response, NextFunction } from "express";
import { StoreService } from "../services/store.service.js";
import { createStoreSchema, updateStoreSchema } from "../schemas/store.schema.js";

export class StoreController {
  static async createStore(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createStoreSchema.parse(req.body);
      // Auto-assign storeAdminId from JWT if not present
      if (!data.storeAdminId && req.user) {
        data.storeAdminId = req.user.userId;
      }
      const store = await StoreService.createStore(data);
      res.status(201).json(store);
    } catch (error) {
      next(error);
    }
  }

  static async getStore(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await StoreService.getStoreById(Number(req.params.id));
      res.status(200).json(store);
    } catch (error) {
      next(error);
    }
  }

  static async updateStore(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateStoreSchema.parse(req.body);
      const store = await StoreService.updateStore(Number(req.params.id), data);
      res.status(200).json(store);
    } catch (error) {
      next(error);
    }
  }

  static async deleteStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await StoreService.deleteStore(Number(req.params.id), reason);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getAllStores(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status;
      const stores = await StoreService.getAllStores(status);
      res.status(200).json(stores);
    } catch (error) {
      next(error);
    }
  }

  static async getStoreByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await StoreService.getStoreByAdmin(req.user!.userId!);
      if (!store) {
        return res.status(200).json(null);
      }
      res.status(200).json(store);
    } catch (error) {
      next(error);
    }
  }

  static async getStoreByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await StoreService.getStoreByEmployee(req.user!.userId!);
      if (!store) {
        return res.status(200).json(null);
      }
      res.status(200).json(store);
    } catch (error) {
       next(error);
    }
  }

  static async moderateStore(req: Request, res: Response, next: NextFunction) {
    try {
      const action = req.query.action as string;
      const storeId = Number(req.params.id);
      
      let status;
      if (action === "approve") status = "ACTIVE";
      else if (action === "block") status = "BLOCKED";
      else if (action === "reject") status = "BLOCKED"; // Or maybe deleted? Frontend uses moderate?
      else status = action; // Direct status pass

      const store = await StoreService.moderateStore(storeId, status);
      res.status(200).json(store);
    } catch (error) {
      next(error);
    }
  }
}
