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
        })).min(1, "At least one item is required"),
    }),
});
