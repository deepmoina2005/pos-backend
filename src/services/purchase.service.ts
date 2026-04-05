import { prisma } from "../lib/prisma.js";
import { CreatePurchaseInput } from "../schemas/purchase.schema.js";

export class PurchaseService {
  static async createPurchase(userId: number, data: CreatePurchaseInput) {
    const { supplierId, branchId, totalAmount, items } = data;

    // Fetch storeId from branch
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { storeId: true }
    });

    if (!branch) throw new Error("Branch not found");
    const storeId = branch.storeId;

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
              batchNo: item.batchNo,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              purchasePrice: item.purchasePrice || item.unitPrice,
            })),
          },
        },
        include: {
          purchaseItems: true,
        },
      });

      // 2. Update Inventory and InventoryBatch for each item
      for (const item of items) {
        // Update total inventory
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

        // Update branch-specific batches if batchNo is provided
        if (item.batchNo) {
          // Auto-enable granular tracking flags if not already enabled
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              trackBatchNumber: true,
              trackExpiryDate: item.expiryDate ? true : undefined
            }
          });

          await tx.inventoryBatch.upsert({
            where: {
              branchId_productId_batchNo: {
                branchId,
                productId: item.productId,
                batchNo: item.batchNo,
              },
            },
            update: {
              quantity: {
                increment: item.quantity,
              },
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
              purchasePrice: item.purchasePrice || item.unitPrice,
            },
            create: {
              storeId,
              branchId,
              productId: item.productId,
              batchNo: item.batchNo,
              quantity: item.quantity,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              purchasePrice: item.purchasePrice || item.unitPrice,
            },
          });
        }
      }

      return purchase;
    }, {
      timeout: 30000 // Increase timeout for complex purchase processing
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
