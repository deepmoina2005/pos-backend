import { z } from "zod";
import { SubscriptionPlan, SubscriptionStatus } from "../generated/client/index.js";

export const createSubscriptionSchema = z.object({
  storeId: z.number().int(),
  planId: z.number().int(),
});

export const updateSubscriptionSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  planId: z.number().int().optional(),
});
