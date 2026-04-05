import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
export class InventoryService {
    static async updateStock(branchId, productId, data) {
        const inventory = await prisma.inventory.upsert({
            where: {
                branchId_productId: { branchId, productId }
            },
            update: {
                quantity: data.quantity,
                minimumStockLevel: data.minimumStockLevel,
                lastRestockedAt: new Date()
            },
            create: {
                branchId,
                productId,
                quantity: data.quantity,
                minimumStockLevel: data.minimumStockLevel ?? 0,
            },
        });
        return inventory;
    }
    static async getInventoryByBranch(branchId) {
        return await prisma.inventory.findMany({
            where: { branchId },
            include: {
                product: {
                    select: { id: true, name: true, sku: true, sellingPrice: true, mrp: true, gst: true }
                }
            }
        });
    }
    static async getInventoryByProduct(productId) {
        return await prisma.inventory.findMany({
            where: { productId },
            include: {
                branch: { select: { id: true, name: true } }
            }
        });
    }
    static async getLowStockAlertsByBranch(branchId) {
        // Prisma doesn't support comparing two columns directly in findMany easily without raw. We can filter in JS for now or use raw.
        // For small data JS is fine, for large data we'd use raw.
        const all = await prisma.inventory.findMany({ where: { branchId }, include: { product: true } });
        return all.filter((item) => item.quantity < item.minimumStockLevel);
    }
    static async bulkImportInventory(branchId, buffer) {
        const xlsx = await import("xlsx");
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        const results = {
            createdCount: 0,
            skippedCount: 0,
            errors: []
        };
        const normalizeHeader = (header) => header.toLowerCase().replace(/[\s_-]/g, "");
        const branch = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch)
            throw new ResourceNotFoundError("Branch", branchId);
        const storeId = branch.storeId;
        for (const [index, row] of data.entries()) {
            try {
                const rowData = {};
                Object.keys(row).forEach(key => {
                    rowData[normalizeHeader(key)] = row[key];
                });
                const sku = rowData.sku?.toString();
                const quantity = Number(rowData.quantity || rowData.stock || rowData.qty);
                const minStock = Number(rowData.minstock || rowData.minimumstock || 0);
                if (!sku) {
                    results.skippedCount++;
                    results.errors.push(`Row ${index + 2}: Missing SKU`);
                    continue;
                }
                if (isNaN(quantity)) {
                    results.skippedCount++;
                    results.errors.push(`Row ${index + 2}: Invalid Quantity for SKU ${sku}`);
                    continue;
                }
                const product = await prisma.product.findFirst({
                    where: {
                        sku: sku,
                        storeId: storeId
                    }
                });
                if (!product) {
                    results.skippedCount++;
                    results.errors.push(`Row ${index + 2}: Product with SKU ${sku} not found`);
                    continue;
                }
                await prisma.inventory.upsert({
                    where: {
                        branchId_productId: {
                            branchId,
                            productId: product.id
                        }
                    },
                    update: {
                        quantity: quantity,
                        minimumStockLevel: minStock || undefined,
                        lastRestockedAt: new Date()
                    },
                    create: {
                        branchId,
                        productId: product.id,
                        quantity: quantity,
                        minimumStockLevel: minStock || 0,
                    }
                });
                results.createdCount++;
            }
            catch (error) {
                results.skippedCount++;
                results.errors.push(`Row ${index + 2}: ${error.message}`);
            }
        }
        return results;
    }
}
