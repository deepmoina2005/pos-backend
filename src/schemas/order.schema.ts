import { z } from "zod";
import { PaymentType, OrderStatus } from "../generated/client/index.js";

export const orderItemSchema = z.object({
  productId: z.coerce.number().int(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
  mrp: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().nonnegative().optional(),
  gstRate: z.coerce.number().nonnegative().optional(),
  gstAmount: z.coerce.number().nonnegative().optional(),
  taxableAmount: z.coerce.number().nonnegative().optional(),
});

export const createOrderSchema = z.object({
  orderItems: z.array(orderItemSchema).min(1),
  paymentType: z.nativeEnum(PaymentType),
  discount: z.coerce.number().nonnegative().default(0),
  totalTax: z.coerce.number().nonnegative().optional(),
  totalDiscount: z.coerce.number().nonnegative().optional(),
  customerId: z.coerce.number().int().optional(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
