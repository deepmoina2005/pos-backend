import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
import { customerSchema, updateCustomerSchema } from "../schemas/customer.schema.js";
import { z } from "zod";

type CustomerInput = z.infer<typeof customerSchema>;

export class CustomerService {
  static async createCustomer(data: CustomerInput, cashierId?: number) {
    return await prisma.customer.create({ 
      data: {
        ...data,
        cashierId
      } 
    });
  }

  static async getCustomerById(id: number) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new ResourceNotFoundError("Customer", id);
    return customer;
  }

  static async listCustomers(search?: string, cashierId?: number) {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (cashierId) {
      whereClause.cashierId = cashierId;
    }

    return await prisma.customer.findMany({
      where: whereClause
    });
  }

  static async updateCustomer(id: number, data: Partial<CustomerInput>) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new ResourceNotFoundError("Customer", id);

    return await prisma.customer.update({ where: { id }, data });
  }

  static async deleteCustomer(id: number) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new ResourceNotFoundError("Customer", id);

    await prisma.customer.delete({ where: { id } });
    return { message: "Customer deleted successfully" };
  }
}
