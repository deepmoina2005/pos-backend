import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
export class CustomerService {
    static async createCustomer(data, cashierId) {
        return await prisma.customer.create({
            data: {
                ...data,
                cashierId
            }
        });
    }
    static async getCustomerById(id) {
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new ResourceNotFoundError("Customer", id);
        return customer;
    }
    static async listCustomers(search, cashierId) {
        const whereClause = {};
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
    static async updateCustomer(id, data) {
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new ResourceNotFoundError("Customer", id);
        return await prisma.customer.update({ where: { id }, data });
    }
    static async deleteCustomer(id) {
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new ResourceNotFoundError("Customer", id);
        await prisma.customer.delete({ where: { id } });
        return { message: "Customer deleted successfully" };
    }
}
