import { prisma } from "../lib/prisma.js";
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

    for (const item of data.orderItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new ResourceNotFoundError("Product", item.productId);

      // Simple stock check
      const inventory = await prisma.inventory.findUnique({
        where: { branchId_productId: { branchId, productId: item.productId } }
      });

      if (!inventory || inventory.quantity < item.quantity) {
        console.error(`Stock check failed: branchId=${branchId}, productId=${item.productId}, requested=${item.quantity}, available=${inventory?.quantity || 0}`);
        throw new UserException(`Insufficient stock for product: ${product.name}`);
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
        subtotal
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
            create: itemsToCreate
          }
        },
        include: { 
          orderItems: { include: { product: true } },
          customer: true
        }
      });

      // Update inventory stock levels
      for (const item of itemsToCreate) {
        await tx.inventory.update({
          where: { branchId_productId: { branchId, productId: item.productId } },
          data: {
            quantity: { decrement: item.quantity }
          }
        });
      }

      return order;
    }, {
      timeout: 15000 // Increase timeout to 15 seconds to prevent expired transactions
    });

    return result;
  }

  static async getOrderById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: true } },
        cashier: { select: { id: true, fullName: true } },
        customer: true,
        branch: true,
      }
    });
    if (!order) throw new ResourceNotFoundError("Order", id);
    return order;
  }

  static async getOrdersByBranch(branchId: number, limit: number = 50, filters?: { cashierId?: number; paymentType?: any; status?: any }) {
    const whereClause: any = { branchId };
    
    if (filters?.cashierId) whereClause.cashierId = filters.cashierId;
    if (filters?.paymentType) whereClause.paymentType = filters.paymentType;
    if (filters?.status) whereClause.status = filters.status;

    return await prisma.order.findMany({
      where: whereClause,
      orderBy: { orderDate: 'desc' },
      take: limit,
      include: { 
        orderItems: { include: { product: true } }, 
        customer: true,
        cashier: { select: { id: true, fullName: true } }
      }
    });
  }

  static async getTodayOrdersByBranch(branchId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.order.findMany({
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
    });
  }

  static async getOrdersByCashier(cashierId: number) {
    return await prisma.order.findMany({
      where: { cashierId },
      orderBy: { orderDate: 'desc' },
      include: { orderItems: { include: { product: true } }, customer: true }
    });
  }

  static async getOrdersByCustomer(customerId: number) {
    return await prisma.order.findMany({
      where: { customerId },
      orderBy: { orderDate: 'desc' },
      include: { orderItems: { include: { product: true } } }
    });
  }
}
