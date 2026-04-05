import { prisma } from "../lib/prisma.js";
import { CreatePurchaseInput } from "../schemas/purchase.schema.js";

export class PurchaseService {
  static async createPurchase(userId: number, data: CreatePurchaseInput) {
    const { supplierId, branchId, totalAmount, items } = data;

    // Generate a unique purchase number
    const purchaseNumber = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Create the Purchase record
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          totalAmount,
          supplierId,
          branchId,
          userId,
          status: "COMPLETED",
          purchaseItems: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          purchaseItems: true,
        },
      });

      // 2. Update Inventory for each item
      for (const item of items) {
        await tx.inventory.upsert({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId,
            },
          },
          update: {
            quantity: {
              increment: item.quantity,
            },
            lastRestockedAt: new Date(),
          },
          create: {
            branchId,
            productId: item.productId,
            quantity: item.quantity,
            lastRestockedAt: new Date(),
          },
        });
      }

      return purchase;
    });
  }

  static async getPurchasesByBranch(branchId: number) {
    return prisma.purchase.findMany({
      where: { branchId },
      include: {
        supplier: true,
        user: {
          select: {
            fullName: true,
          },
        },
        purchaseItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
