import { z } from "zod";
export const customerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});
export const updateCustomerSchema = customerSchema.partial();
