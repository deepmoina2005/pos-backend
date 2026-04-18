import { prisma } from "../lib/prisma.js";
import { createStoreSchema, updateStoreSchema } from "../schemas/store.schema.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
import { z } from "zod";
import { NotificationService } from "./notification.service.js";
import { normalizeRole } from "../utils/role.util.js";

type CreateStoreInput = z.infer<typeof createStoreSchema>;
type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

export class StoreService {
  static async createStore(data: CreateStoreInput) {
    const store = await prisma.$transaction(async (tx) => {
      const createdStore = await tx.store.create({
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
            select: { id: true, email: true, fullName: true, role: true }
          }
        }
      });

      if (createdStore.storeAdminId) {
        const ownerRole = normalizeRole(createdStore.storeAdmin?.role);
        if (ownerRole && ownerRole !== "SUPER_ADMIN") {
          await tx.user.update({
            where: { id: createdStore.storeAdminId },
            data: { storeId: createdStore.id },
          });
        }
      }

      return createdStore;
    });

    await NotificationService.createNotification({
      title: "New Store Registration",
      message: `A new store "${data.name}" has been registered and is pending approval.`,
      type: "info"
    });

    return store;
  }

  static async getStoreById(id: number) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        branches: true,
        storeAdmin: {
          select: { id: true, email: true, fullName: true }
        }
      }
    });

    if (!store) throw new ResourceNotFoundError("Store", id);
    return store;
  }

  static async updateStore(id: number, data: UpdateStoreInput) {
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) throw new ResourceNotFoundError("Store", id);

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

  static async deleteStore(id: number, reason: string) {
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) throw new ResourceNotFoundError("Store", id);

    const deletionReason = reason?.trim() || "No reason provided";

    await prisma.$transaction(async (tx) => {
      // Preserve audit trail for deleted stores.
      await tx.deletedStore.create({
        data: {
          storeId: store.id,
          name: store.name,
          reason: deletionReason,
          contactEmail: store.contactEmail,
          contactPhone: store.contactPhone,
          storeType: store.storeType
        }
      });

      // Prevent FK violation on InventoryBatch -> OrderItemBatch(batchId).
      // Orders are removed via cascades, but this explicit cleanup keeps delete order deterministic.
      await tx.orderItemBatch.deleteMany({
        where: {
          batch: {
            branch: {
              storeId: id,
            },
          },
        },
      });

      await tx.store.delete({ where: { id } });
    });
    
    await NotificationService.createNotification({
      title: "Store Deleted",
      message: `The store "${store.name}" has been deleted by SuperAdmin. Reason: ${deletionReason}`,
      type: "warning"
    });

    return { message: "Store deleted successfully" };
  }

  static async moderateStore(id: number, status: any) {
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) throw new ResourceNotFoundError("Store", id);

    const updatedStore = await prisma.$transaction(async (tx) => {
      const updated = await tx.store.update({
        where: { id },
        data: { status },
        include: { storeAdmin: { select: { id: true, email: true, role: true } } }
      });

      if (updated.storeAdminId) {
        const ownerRole = normalizeRole(updated.storeAdmin?.role);
        if (ownerRole && ownerRole !== "SUPER_ADMIN") {
          await tx.user.update({
            where: { id: updated.storeAdminId },
            data: { storeId: updated.id },
          });
        }
      }

      return updated;
    });

    await NotificationService.createNotification({
      title: `Store ${status.toLowerCase()}`,
      message: `The store "${store.name}" has been ${status.toLowerCase()}.`,
      type: status === "ACTIVE" ? "success" : "warning",
      userId: store.storeAdminId || undefined
    });

    return updatedStore;
  }

  static async getStoreByAdmin(adminId: number) {
    return await prisma.store.findUnique({
      where: { storeAdminId: adminId },
      include: {
        branches: true,
        storeAdmin: { select: { id: true, email: true, fullName: true } }
      }
    });
  }

  static async getStoreByEmployee(employeeId: number) {
    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    return user?.store || null;
  }

  static async getAllStores(status?: any) {
    return await prisma.store.findMany({
      where: status ? { status } : undefined,
      include: {
        storeAdmin: { select: { id: true, email: true } },
        _count: { select: { branches: true, employees: true } }
      }
    });
  }
}
