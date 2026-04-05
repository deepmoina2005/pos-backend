import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError } from "../exceptions/AppError.js";
import { createCategorySchema, updateCategorySchema } from "../schemas/product.schema.js";
import { z } from "zod";
import * as XLSX from "xlsx";

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export class CategoryService {
  static async createCategory(data: CreateCategoryInput) {
    return await prisma.category.create({
      data: {
        name: data.name,
        storeId: data.storeId,
      },
    });
  }

  static async bulkImportCategories(storeId: number, buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let createdCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const rawRow of data as any[]) {
      try {
        const row: any = {};
        for (const key of Object.keys(rawRow)) {
          const normalizedKey = key.toLowerCase().replace(/[\s_]/g, "");
          row[normalizedKey] = rawRow[key];
        }

        const name = row.name || row.categoryname || row.category || row.group;
        if (!name) {
          errors.push(`Row ${createdCount + skippedCount + 1}: Missing category name`);
          skippedCount++;
          continue;
        }

        const catName = String(name).trim();
        const existing = await prisma.category.findFirst({
          where: { name: catName, storeId }
        });

        if (!existing) {
          await prisma.category.create({
            data: { name: catName, storeId }
          });
          createdCount++;
        } else {
          // Already exists, just count as success or ignore
          createdCount++; 
        }
      } catch (err: any) {
        errors.push(`Row ${createdCount + skippedCount + 1}: ${err.message}`);
        skippedCount++;
      }
    }

    return { createdCount, skippedCount, errors };
  }

  static async getCategoriesByStore(storeId: number) {
    return await prisma.category.findMany({
      where: { storeId },
      include: { _count: { select: { products: true } } },
    });
  }

  static async updateCategory(id: number, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new ResourceNotFoundError("Category", id);

    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  static async deleteCategory(id: number) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new ResourceNotFoundError("Category", id);

    await prisma.category.delete({ where: { id } });
    return { message: "Category deleted successfully" };
  }
}
