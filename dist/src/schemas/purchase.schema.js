import { z } from "zod";
export const createPurchaseSchema = z.object({
    body: z.object({
        supplierId: z.coerce.number().int().positive("Supplier ID is required"),
        branchId: z.coerce.number().int().positive("Branch ID is required"),
        totalAmount: z.coerce.number().nonnegative(),
        items: z.array(z.object({
            productId: z.coerce.number().int().positive(),
            quantity: z.coerce.number().int().positive(),
            unitPrice: z.coerce.number().nonnegative(),
            batchNo: z.string().optional(),
            expiryDate: z.coerce.string().optional().nullable(),
            purchasePrice: z.coerce.number().nonnegative().optional(),
        })).min(1, "At least one item is required"),
    }),
});
