import { prisma } from "../lib/prisma.js";
export class SupplierService {
    static async createSupplier(data) {
        return prisma.supplier.create({
            data,
        });
    }
    static async getSuppliersByStore(storeId) {
        return prisma.supplier.findMany({
            where: { storeId },
            orderBy: { name: "asc" },
        });
    }
    static async updateSupplier(id, data) {
        return prisma.supplier.update({
            where: { id },
            data,
        });
    }
    static async deleteSupplier(id) {
        return prisma.supplier.delete({
            where: { id },
        });
    }
}
