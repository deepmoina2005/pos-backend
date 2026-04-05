import { ProductService } from "../services/product.service.js";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema.js";
export class ProductController {
    static async createProduct(req, res, next) {
        try {
            const data = createProductSchema.parse(req.body);
            const product = await ProductService.createProduct(data);
            res.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    }
    static async getProduct(req, res, next) {
        try {
            const product = await ProductService.getProductById(Number(req.params.id));
            res.status(200).json(product);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStoreProducts(req, res, next) {
        try {
            const { q } = req.query;
            const products = await ProductService.getProductsByStore(Number(req.params.storeId), q);
            res.status(200).json(products);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateProduct(req, res, next) {
        try {
            const data = updateProductSchema.parse(req.body);
            const product = await ProductService.updateProduct(Number(req.params.id), data);
            res.status(200).json(product);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteProduct(req, res, next) {
        try {
            await ProductService.deleteProduct(Number(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    static async importProducts(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            const { storeId } = req.body;
            if (!storeId) {
                return res.status(400).json({ message: "Store ID is required" });
            }
            const result = await ProductService.bulkImportProducts(Number(storeId), req.file.buffer);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
