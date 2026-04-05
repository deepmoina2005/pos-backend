import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service.js";
import { createCategorySchema, updateCategorySchema } from "../schemas/product.schema.js";

export class CategoryController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await CategoryService.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  static async getCategoriesByStore(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getCategoriesByStore(Number(req.params.storeId));
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCategorySchema.parse(req.body);
      const category = await CategoryService.updateCategory(Number(req.params.id), data);
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await CategoryService.deleteCategory(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async importCategories(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { storeId } = req.body;
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }

      const result = await CategoryService.bulkImportCategories(Number(storeId), (req.file as any).buffer);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
