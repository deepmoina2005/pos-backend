import { prisma } from "../lib/prisma.js";
import { withDbRetry } from "../utils/db-utils.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
export class BranchService {
    static async createBranch(data) {
        const storeId = data.storeId || 0;
        const store = await withDbRetry(() => prisma.store.findUnique({ where: { id: storeId } }));
        if (!store)
            throw new ResourceNotFoundError("Store", storeId);
        return await prisma.branch.create({
            data: {
                name: data.name,
                location: data.location || data.address,
                address: data.address || data.location,
                phone: data.phone,
                email: data.email,
                logoUrl: data.logoUrl,
                storeId: storeId,
                managerId: data.managerId,
                openingTime: data.openingTime,
                closingTime: data.closingTime,
                workingDays: data.workingDays,
                printerSettings: data.printerSettings,
                taxSettings: data.taxSettings,
                paymentSettings: data.paymentSettings,
                discountSettings: data.discountSettings,
            },
            include: {
                manager: { select: { id: true, email: true, fullName: true } },
                _count: { select: { employees: true, inventories: true } },
            },
        });
    }
    static async getBranchById(id) {
        const branch = await withDbRetry(() => prisma.branch.findUnique({
            where: { id },
            include: {
                store: true,
                manager: { select: { id: true, email: true, fullName: true } },
            },
        }));
        if (!branch)
            throw new ResourceNotFoundError("Branch", id);
        return branch;
    }
    static async getBranchesByStore(storeId) {
        return await withDbRetry(() => prisma.branch.findMany({
            where: { storeId },
            include: {
                manager: { select: { id: true, email: true, fullName: true } },
                _count: { select: { employees: true, inventories: true } }
            }
        }));
    }
    static async updateBranch(id, data) {
        const branch = await prisma.branch.findUnique({ where: { id } });
        if (!branch)
            throw new ResourceNotFoundError("Branch", id);
        return await prisma.branch.update({
            where: { id },
            data: {
                name: data.name,
                location: data.location || data.address,
                address: data.address || data.location,
                phone: data.phone,
                email: data.email,
                logoUrl: data.logoUrl,
                managerId: data.managerId,
                openingTime: data.openingTime,
                closingTime: data.closingTime,
                workingDays: data.workingDays,
                printerSettings: data.printerSettings,
                taxSettings: data.taxSettings,
                paymentSettings: data.paymentSettings,
                discountSettings: data.discountSettings,
            },
            include: {
                manager: { select: { id: true, email: true, fullName: true } },
                _count: { select: { employees: true, inventories: true } },
            },
        });
    }
    static async deleteBranch(id) {
        const branch = await prisma.branch.findUnique({ where: { id } });
        if (!branch)
            throw new ResourceNotFoundError("Branch", id);
        await prisma.branch.delete({ where: { id } });
        return { message: "Branch deleted successfully" };
    }
}
