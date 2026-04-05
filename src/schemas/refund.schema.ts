import { z } from "zod";

export const createRefundSchema = z.object({
  orderId: z.number().int(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  shiftReportId: z.number().int().optional(),
});
