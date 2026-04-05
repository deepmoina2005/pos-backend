import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError, UserException } from "../exceptions/AppError.js";
import { createRefundSchema } from "../schemas/refund.schema.js";
import { OrderStatus } from "../generated/client/index.js";
import { z } from "zod";

type CreateRefundInput = z.infer<typeof createRefundSchema>;

export class RefundService {
  static async createRefund(data: CreateRefundInput, cashierId: number) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { branch: true }
    });

    if (!order) throw new ResourceNotFoundError("Order", data.orderId);
    if (order.status === OrderStatus.REFUNDED) throw new UserException("Order already refunded");
    
    // Check if amount is valid
    if (data.amount > order.finalAmount) {
      throw new UserException("Refund amount cannot exceed order total");
    }

    const cashier = await prisma.user.findUnique({ where: { id: cashierId } });
    if (!cashier) throw new ResourceNotFoundError("User", cashierId);

    const activeShift = await prisma.shiftReport.findFirst({
      where: { cashierId, endTime: null },
      orderBy: { startTime: 'desc' }
    });
    
    const finalShiftReportId = data.shiftReportId || activeShift?.id || null;

    return await prisma.$transaction(async (tx: any) => {
      // Create Refund record
      const refund = await tx.refund.create({
        data: {
          amount: data.amount,
          reason: data.reason,
          orderId: data.orderId,
          cashierId,
          branchId: order.branchId,
          shiftReportId: finalShiftReportId,
          refundDate: new Date()
        }
      });

      // Update Order status
      await tx.order.update({
        where: { id: data.orderId },
        data: { status: OrderStatus.REFUNDED }
      });

      return refund;
    });
  }

  static async getRefundsByBranch(branchId: number) {
    return await prisma.refund.findMany({
      where: { branchId },
      include: { 
        order: {
          include: {
            customer: true,
            orderItems: {
              include: { product: true }
            }
          }
        }, 
        cashier: { select: { fullName: true } } 
      },
      orderBy: { refundDate: 'desc' }
    });
  }

  static async getRefundsByCashier(cashierId: number) {
    return await prisma.refund.findMany({
      where: { cashierId },
      include: { 
        order: {
          include: {
            customer: true,
            orderItems: {
              include: { product: true }
            }
          }
        }
      },
      orderBy: { refundDate: 'desc' }
    });
  }
}
