import { z } from "zod";

export const startShiftSchema = z.object({
  openingBalance: z.number().nonnegative().optional().default(0),
});

export const endShiftSchema = z.object({
  // closingBalance is usually calculated but can be optionally provided
  closingBalance: z.number().nonnegative().optional(),
});
