import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
import { NotificationService } from "./notification.service.js";
export class StoreService {
    static async createStore(data) {
        const store = await prisma.store.create({
            data: {
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                contactAddress: data.contactAddress,
                storeAdminId: data.storeAdminId,
                storeType: data.storeType,
                gstNumber: data.gstNumber,
                panNumber: data.panNumber,
            },
            include: {
                storeAdmin: {
                    select: { id: true, email: true, fullName: true }
                }
            }
        });
        await NotificationService.createNotification({
            title: "New Store Registration",
            message: `A new store "${data.name}" has been registered and is pending approval.`,
            type: "info"
        });
        return store;
    }
    static async getStoreById(id) {
        const store = await prisma.store.findUnique({
            where: { id },
            include: {
                branches: true,
                storeAdmin: {
                    select: { id: true, email: true, fullName: true }
                }
            }
        });
        if (!store)
            throw new ResourceNotFoundError("Store", id);
        return store;
    }
    static async updateStore(id, data) {
        const store = await prisma.store.findUnique({ where: { id } });
        if (!store)
            throw new ResourceNotFoundError("Store", id);
        return await prisma.store.update({
            where: { id },
            data: {
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                contactAddress: data.contactAddress,
                storeAdminId: data.storeAdminId,
                status: data.status,
                storeType: data.storeType,
                gstNumber: data.gstNumber,
                panNumber: data.panNumber,
                currency: data.currency,
            }
        });
    }
    static async deleteStore(id, reason) {
        const store = await prisma.store.findUnique({ where: { id } });
        if (!store)
            throw new ResourceNotFoundError("Store", id);
        // Create a record of the deleted store
        await prisma.deletedStore.create({
            data: {
                storeId: store.id,
                name: store.name,
                reason: reason || "No reason provided",
                contactEmail: store.contactEmail,
                contactPhone: store.contactPhone,
                storeType: store.storeType
            }
        });
        await prisma.store.delete({ where: { id } });
        await NotificationService.createNotification({
            title: "Store Deleted",
            message: `The store "${store.name}" has been deleted by SuperAdmin. Reason: ${reason}`,
            type: "warning"
        });
        return { message: "Store deleted successfully" };
    }
    static async moderateStore(id, status) {
        const store = await prisma.store.findUnique({ where: { id } });
        if (!store)
            throw new ResourceNotFoundError("Store", id);
        const updatedStore = await prisma.store.update({
            where: { id },
            data: { status },
            include: { storeAdmin: { select: { id: true, email: true } } }
        });
        await NotificationService.createNotification({
            title: `Store ${status.toLowerCase()}`,
            message: `The store "${store.name}" has been ${status.toLowerCase()}.`,
            type: status === "ACTIVE" ? "success" : "warning",
            userId: store.storeAdminId || undefined
        });
        return updatedStore;
    }
    static async getStoreByAdmin(adminId) {
        return await prisma.store.findUnique({
            where: { storeAdminId: adminId },
            include: {
                branches: true,
                storeAdmin: { select: { id: true, email: true, fullName: true } }
            }
        });
    }
    static async getStoreByEmployee(employeeId) {
        const user = await prisma.user.findUnique({
            where: { id: employeeId },
            include: { store: true }
        });
        return user?.store || null;
    }
    static async getAllStores(status) {
        return await prisma.store.findMany({
            where: status ? { status } : undefined,
            include: {
                storeAdmin: { select: { id: true, email: true } },
                _count: { select: { branches: true, employees: true } }
            }
        });
    }
}
