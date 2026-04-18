import { z } from "zod";
import { normalizeRole } from "../utils/role.util.js";
const roleSchema = z
    .string()
    .transform((value) => normalizeRole(value) || value)
    .pipe(z.enum(["SUPER_ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "CASHIER", "CUSTOMER"]));
export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: roleSchema.optional(),
    storeId: z.union([z.string(), z.number()]).optional().transform(v => v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
    branchId: z.union([z.string(), z.number()]).optional().transform(v => v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
});
export const createUserSchema = updateUserSchema.extend({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: roleSchema,
});
