import { z } from "zod";
import { UserRole } from "../generated/client/index.js";
export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.nativeEnum(UserRole).optional(),
    storeId: z.union([z.string(), z.number()]).optional().transform(v => v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
    branchId: z.union([z.string(), z.number()]).optional().transform(v => v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
});
export const createUserSchema = updateUserSchema.extend({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole),
});
