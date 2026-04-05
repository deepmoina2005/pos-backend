import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError, UserException } from "../exceptions/AppError.js";
import * as XLSX from "xlsx";
export class ProductService {
    static async createProduct(data) {
        const existingProduct = await prisma.product.findUnique({ where: { sku: data.sku } });
        if (existingProduct)
            throw new UserException(`Product with SKU ${data.sku} already exists`);
        return await prisma.product.create({
            data,
            include: { category: true }
        });
    }
    static async bulkImportProducts(storeId, buffer) {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        let createdCount = 0;
        let skippedCount = 0;
        const errors = [];
        for (const rawRow of data) {
            try {
                // Normalize keys to lowercase and remove spaces/underscores for flexible matching
                const row = {};
                for (const key of Object.keys(rawRow)) {
                    const normalizedKey = key.toLowerCase().replace(/[\s_]/g, "");
                    row[normalizedKey] = rawRow[key];
                }
                const name = row.name || row.productname || row.itemname || row.product;
                let sku = String(row.sku || row.code || row.productcode || row.id || "").trim();
                const sellingPrice = parseFloat(String(row.sellingprice || row.price || row.salesprice || row.rate || "0"));
                const mrp = parseFloat(String(row.mrp || row.marketprice || row.maxretailprice || "0"));
                const costPrice = parseFloat(String(row.costprice || row.cost || row.purchaseprice || "0"));
                const gstRate = parseFloat(String(row.gst || row.tax || row.gstrate || row.taxrate || "0"));
                const categoryName = row.category || row.categoryname || row.group;
                const description = row.description || row.desc || row.remarks || "";
                if (!name) {
                    errors.push(`Row ${createdCount + skippedCount + 1}: Missing product name`);
                    skippedCount++;
                    continue;
                }
                if (!sku) {
                    // If no SKU, try to generate one or skip
                    errors.push(`Row ${createdCount + skippedCount + 1} (${name}): Missing SKU/Code`);
                    skippedCount++;
                    continue;
                }
                const nameStr = String(name || "").trim();
                const sellingPriceVal = isNaN(sellingPrice) ? 0 : sellingPrice;
                const mrpVal = isNaN(mrp) ? 0 : mrp;
                const costPriceVal = isNaN(costPrice) ? 0 : costPrice;
                const gstVal = isNaN(gstRate) ? 0 : gstRate;
                // Handle Category
                let categoryId;
                if (categoryName) {
                    const catName = String(categoryName).trim();
                    let cat = await prisma.category.findFirst({
                        where: { name: catName, storeId }
                    });
                    if (!cat) {
                        cat = await prisma.category.create({
                            data: { name: catName, storeId }
                        });
                    }
                    categoryId = cat.id;
                }
                const productData = {
                    name: nameStr,
                    sellingPrice: sellingPriceVal,
                    mrp: mrpVal,
                    costPrice: costPriceVal,
                    gst: gstVal,
                    categoryId,
                    description: String(description).trim(),
                    storeId
                };
                const existing = await prisma.product.findUnique({ where: { sku } });
                if (existing) {
                    await prisma.product.update({
                        where: { sku },
                        data: productData
                    });
                    createdCount++;
                }
                else {
                    await prisma.product.create({
                        data: {
                            ...productData,
                            sku
                        }
                    });
                    createdCount++;
                }
            }
            catch (err) {
                errors.push(`Row ${createdCount + skippedCount + 1}: ${err.message}`);
                skippedCount++;
            }
        }
        return { createdCount, skippedCount, errors };
    }
    static async getProductById(id) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true, store: true }
        });
        if (!product)
            throw new ResourceNotFoundError("Product", id);
        return product;
    }
    static async getProductsByStore(storeId, search) {
        return await prisma.product.findMany({
            where: {
                storeId,
                OR: search ? [
                    { name: { contains: search } },
                    { sku: { contains: search } },
                    { description: { contains: search } },
                ] : undefined
            },
            include: { category: true }
        });
    }
    static async updateProduct(id, data) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new ResourceNotFoundError("Product", id);
        if (data.sku && data.sku !== product.sku) {
            const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
            if (existing)
                throw new UserException("New SKU is already taken");
        }
        return await prisma.product.update({
            where: { id },
            data,
            include: { category: true }
        });
    }
    static async deleteProduct(id) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new ResourceNotFoundError("Product", id);
        await prisma.product.delete({ where: { id } });
        return { message: "Product deleted successfully" };
    }
}
