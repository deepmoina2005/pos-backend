import { InventoryService } from "../services/inventory.service.js";
import { updateInventorySchema } from "../schemas/product.schema.js";
export class InventoryController {
    static async updateStock(req, res, next) {
        try {
            const { branchId, productId } = req.body; // or from params depending on frontend flow
            const data = updateInventorySchema.parse(req.body);
            const inventory = await InventoryService.updateStock(Number(branchId), Number(productId), data);
            res.status(200).json(inventory);
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranchInventory(req, res, next) {
        try {
            const inventory = await InventoryService.getInventoryByBranch(Number(req.params.branchId));
            res.status(200).json(inventory);
        }
        catch (error) {
            next(error);
        }
    }
    static async getProductInventory(req, res, next) {
        try {
            const inventory = await InventoryService.getInventoryByProduct(Number(req.params.productId));
            res.status(200).json(inventory);
        }
        catch (error) {
            next(error);
        }
    }
    static async bulkImportInventory(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranchBatches(req, res, next) {
        try {
            const batches = await InventoryService.getInventoryBatchesByBranch(Number(req.params.branchId));
            res.status(200).json(batches);
        }
        catch (error) {
            next(error);
        }
    }
    static async getProductBatches(req, res, next) {
        try {
            const { branchId, productId } = req.params;
            const batches = await InventoryService.getInventoryBatchesByProduct(Number(branchId), Number(productId));
            res.status(200).json(batches);
        }
        catch (error) {
            next(error);
        }
    }
    static async getExpiryAlerts(req, res, next) {
        try {
            const alerts = await InventoryService.getExpiryAlertsByBranch(Number(req.params.branchId));
            res.status(200).json(alerts);
        }
        catch (error) {
            next(error);
        }
    }
}
