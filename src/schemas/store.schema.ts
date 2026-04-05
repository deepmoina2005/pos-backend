import { z } from "zod";
import { StoreStatus } from "../generated/client/index.js";

export const createStoreSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  storeAdminId: z.number().optional(),
  storeType: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  currency: z.enum(["INR", "USD"]).default("INR").optional(),
});

export const updateStoreSchema = createStoreSchema.partial().extend({
  status: z.nativeEnum(StoreStatus).optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  storeId: z.coerce.number().optional(),
  managerId: z.coerce.number().optional(),
  openingTime: z.string().optional().nullable(),
  closingTime: z.string().optional().nullable(),
  workingDays: z.any().optional().nullable(),
  printerSettings: z.any().optional().nullable(),
  taxSettings: z.any().optional().nullable(),
  paymentSettings: z.any().optional().nullable(),
  discountSettings: z.any().optional().nullable(),
});

export const updateBranchSchema = createBranchSchema.partial();
