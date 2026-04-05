import { prisma } from "../lib/prisma.js";
import { withDbRetry } from "../utils/db-utils.js";
import { ResourceNotFoundError, UserException } from "../exceptions/AppError.js";
import { CreateOrderInput } from "../schemas/order.schema.js";
import { OrderStatus } from "../generated/client/index.js";

export class OrderService {
  static async createOrder(data: CreateOrderInput, cashierId: number) {
    // 1. Validate Cashier and get Branch
    const cashier = await prisma.user.findUnique({
      where: { id: cashierId },
      include: { branch: true }
    });

    if (!cashier || !cashier.branchId) {
      throw new UserException("Cashier must be assigned to a branch to create orders");
    }

    const branchId = cashier.branchId;

    // 2. Validate Customer if provided
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) throw new ResourceNotFoundError("Customer", data.customerId);
    }

    // 3. Process Order Items and calculate totals
    let totalGrossAmount = 0; // Sum of (MRP * quantity)
    let totalTax = 0;
    let totalItemDiscount = 0; // Sum of ((MRP - unitPrice) * quantity)
    
    const itemsToCreate: any[] = [];
    const batchDeductions: { productId: number, quantity: number, batches: { batchId: number, quantity: number }[] }[] = [];

    const now = new Date();

    for (const item of data.orderItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new ResourceNotFoundError("Product", item.productId);

      // 3.1 Stock Check and Batch Selection
      if (product.trackBatchNumber || product.trackExpiryDate) {
        // Fetch valid batches (not expired, sorted by expiry date)
        const availableBatches = await prisma.inventoryBatch.findMany({
          where: {
            branchId,
            productId: item.productId,
            quantity: { gt: 0 },
            OR: [
              { expiryDate: { gt: now } },
              { expiryDate: null }
            ]
          },
          orderBy: { expiryDate: 'asc' } // FIFO: Earliest expiry first
        });

        const totalBatchStock = availableBatches.reduce((sum, b) => sum + b.quantity, 0);
        if (totalBatchStock < item.quantity) {
          throw new UserException(`Insufficient unexpired stock for product: ${product.name}. Available: ${totalBatchStock}`);
        }

        // Determine which batches to use
        let remainingToDeduct = item.quantity;
        const usedBatches: { batchId: number, quantity: number }[] = [];

        for (const batch of availableBatches) {
          if (remainingToDeduct <= 0) break;
          const take = Math.min(batch.quantity, remainingToDeduct);
          usedBatches.push({ batchId: batch.id, quantity: take });
          remainingToDeduct -= take;
        }

        batchDeductions.push({ productId: item.productId, quantity: item.quantity, batches: usedBatches });
      } else {
        // Simple stock check for non-batch products
        const inventory = await prisma.inventory.findUnique({
          where: { branchId_productId: { branchId, productId: item.productId } }
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new UserException(`Insufficient stock for product: ${product.name}`);
        }
        
        batchDeductions.push({ productId: item.productId, quantity: item.quantity, batches: [] });
      }

      const quantity = item.quantity;
      const unitPrice = item.unitPrice; // Selling price (taxable)
      const mrp = product.mrp || unitPrice;
      const costPriceSnapshot = product.costPrice || 0;
      const gstRate = product.gst || 0;
      
      const itemDiscount = Math.max(0, (mrp - unitPrice) * quantity);
      const taxableAmount = quantity * unitPrice;
      const gstAmount = (taxableAmount * gstRate) / 100;
      const subtotal = taxableAmount + gstAmount;

      totalGrossAmount += (mrp * quantity);
      totalTax += gstAmount;
      totalItemDiscount += itemDiscount;

      itemsToCreate.push({
        productId: item.productId,
        quantity,
        unitPrice, // selling price
        mrp,
        costPriceSnapshot,
        discount: itemDiscount,
        gstRate,
        gstAmount,
        taxableAmount,
        subtotal,
        isBatchProduct: product.trackBatchNumber || product.trackExpiryDate // Temp flag for internal use
      });
    }

    const orderLevelDiscount = data.discount || 0;
    const totalDiscount = totalItemDiscount + orderLevelDiscount;
    const finalAmount = Math.max(0, (totalGrossAmount - totalDiscount) + totalTax);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Create Order and update Inventory in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          totalAmount: totalGrossAmount,
          discount: orderLevelDiscount,
          totalTax,
          totalDiscount,
          finalAmount,
          paymentType: data.paymentType,
          status: OrderStatus.COMPLETED,
          branchId,
          cashierId,
          customerId: data.customerId,
          orderItems: {
            create: itemsToCreate.map(item => {
              const { isBatchProduct, ...cleanItem } = item;
              return cleanItem;
            })
          }
        },
        include: { 
          orderItems: { include: { product: true } },
          customer: true
        }
      });

      // Update inventory stock levels and batches
      for (let i = 0; i < itemsToCreate.length; i++) {
        const item = itemsToCreate[i];
        const deduction = batchDeductions[i];
        const orderItem = order.orderItems.find((oi: any) => oi.productId === item.productId);

        // Update total inventory
        await tx.inventory.update({
          where: { branchId_productId: { branchId, productId: item.productId } },
          data: {
            quantity: { decrement: item.quantity }
          }
        });

        // Update specific batches if tracked
        if (item.isBatchProduct && orderItem) {
          for (const usedBatch of deduction.batches) {
            await tx.inventoryBatch.update({
              where: { id: usedBatch.batchId },
              data: { quantity: { decrement: usedBatch.quantity } }
            });

            // Track batch usage in OrderItemBatch
            await tx.orderItemBatch.create({
              data: {
                orderItemId: orderItem.id,
                batchId: usedBatch.batchId,
                quantity: usedBatch.quantity
              }
            });
          }
        }
      }

      return order;
    }, {
      timeout: 20000 // Increased timeout for batch processing
    });

    return result;
  }

  static async getOrderById(id: number) {
    const order = await withDbRetry(() => prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: true } },
        cashier: { select: { id: true, fullName: true } },
        customer: true,
        branch: true,
      }
    }));
    if (!order) throw new ResourceNotFoundError("Order", id);
    return order;
  }

  static async getOrdersByBranch(branchId: number, limit: number = 50, filters?: { cashierId?: number; paymentType?: any; status?: any }) {
    const whereClause: any = { branchId };
    
    if (filters?.cashierId) whereClause.cashierId = filters.cashierId;
    if (filters?.paymentType) whereClause.paymentType = filters.paymentType;
    if (filters?.status) whereClause.status = filters.status;

    return await withDbRetry(() => prisma.order.findMany({
      where: whereClause,
      orderBy: { orderDate: 'desc' },
      take: limit,
      include: { 
        orderItems: { include: { product: true } }, 
        customer: true,
        cashier: { select: { id: true, fullName: true } }
      }
    }));
  }

  static async getTodayOrdersByBranch(branchId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await withDbRetry(() => prisma.order.findMany({
      where: {
        branchId,
        orderDate: { gte: today }
      },
      orderBy: { orderDate: 'desc' },
      include: { 
        orderItems: { include: { product: true } }, 
        customer: true,
        cashier: { select: { id: true, fullName: true } }
      }
    }));
  }

  static async getOrdersByCashier(cashierId: number) {
    return await withDbRetry(() => prisma.order.findMany({
      where: { cashierId },
      orderBy: { orderDate: 'desc' },
      include: { orderItems: { include: { product: true } }, customer: true }
    }));
  }

  static async getOrdersByCustomer(customerId: number) {
    return await withDbRetry(() => prisma.order.findMany({
      where: { customerId },
      orderBy: { orderDate: 'desc' },
      include: { orderItems: { include: { product: true } } }
    }));
  }
}
