import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  storeId: z.number().int(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  sellingPrice: z.number().positive(),
  mrp: z.number().nonnegative().optional().default(0),
  costPrice: z.number().nonnegative().optional().default(0),
  gst: z.number().min(0).max(100).optional().default(0),
  categoryId: z.number().int().optional(),
  storeId: z.number().int(),
  image: z.string().url().optional().nullable().or(z.literal("")),
  description: z.string().optional(),
  trackBatchNumber: z.boolean().optional().default(false),
  trackExpiryDate: z.boolean().optional().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const updateInventorySchema = z.object({
  quantity: z.number().int(),
  minimumStockLevel: z.number().int().optional(),
});
