import { prisma } from "../lib/prisma.js";
import { CreateSupplierInput, UpdateSupplierInput } from "../schemas/supplier.schema.js";

export class SupplierService {
  static async createSupplier(data: CreateSupplierInput) {
    return prisma.supplier.create({
      data,
    });
  }

  static async getSuppliersByStore(storeId: number) {
    return prisma.supplier.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    });
  }

  static async updateSupplier(id: number, data: UpdateSupplierInput) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  static async deleteSupplier(id: number) {
    return prisma.supplier.delete({
      where: { id },
    });
  }
}
