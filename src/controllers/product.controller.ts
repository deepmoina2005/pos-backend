import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service.js";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema.js";

export class ProductController {
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await ProductService.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(Number(req.params.id));
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  static async getStoreProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      const products = await ProductService.getProductsByStore(Number(req.params.storeId), q as string);
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await ProductService.updateProduct(Number(req.params.id), data);
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteProduct(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async importProducts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { storeId } = req.body;
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }

      const result = await ProductService.bulkImportProducts(Number(storeId), (req.file as any).buffer);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
