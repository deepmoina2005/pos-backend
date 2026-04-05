import { PurchaseService } from "../services/purchase.service.js";
export const createPurchase = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const purchase = await PurchaseService.createPurchase(Number(userId), req.body);
        res.status(201).json(purchase);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const getPurchases = async (req, res) => {
    try {
        const branchId = parseInt(req.query.branchId);
        if (!branchId)
            throw new Error("Branch ID is required");
        const purchases = await PurchaseService.getPurchasesByBranch(branchId);
        res.status(200).json(purchases);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
