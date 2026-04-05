import { z } from "zod";
export const createSupplierSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        contactPerson: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        address: z.string().optional(),
        storeId: z.coerce.number().int().positive("Store ID is required"),
    }),
});
export const updateSupplierSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        contactPerson: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});
