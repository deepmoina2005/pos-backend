import { z } from "zod";

export const createExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    category: z.string().min(1, "Category is required"),
    date: z.string().optional().transform((val) => {
      if (!val) return new Date();
      const date = new Date(val);
      return isNaN(date.getTime()) ? new Date() : date;
    }),
    branchId: z.coerce.number().int().positive("Branch ID is required"),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    description: z.string().optional(),
    amount: z.coerce.number().positive().optional(),
    category: z.string().optional(),
    date: z.string().optional().transform((val) => {
      if (!val) return undefined;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }),
  }),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>["body"];
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>["body"];
