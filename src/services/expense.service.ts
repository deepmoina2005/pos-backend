import { prisma } from "../lib/prisma.js";
import { CreateExpenseInput, UpdateExpenseInput } from "../schemas/expense.schema.js";

export class ExpenseService {
  static async createExpense(data: CreateExpenseInput) {
    return prisma.expense.create({
      data,
    });
  }

  static async getExpensesByBranch(branchId: number) {
    return prisma.expense.findMany({
      where: { branchId },
      orderBy: { date: "desc" },
    });
  }

  static async getExpenseById(id: number) {
    return prisma.expense.findUnique({
      where: { id },
    });
  }

  static async updateExpense(id: number, data: UpdateExpenseInput) {
    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  static async deleteExpense(id: number) {
    return prisma.expense.delete({
      where: { id },
    });
  }

  static async getBranchExpenseStats(branchId: number) {
    const totalExpenses = await prisma.expense.aggregate({
      where: { branchId },
      _sum: {
        amount: true,
      },
    });

    return {
      totalExpenses: totalExpenses._sum.amount || 0,
    };
  }
}
