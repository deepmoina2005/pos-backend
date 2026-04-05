import { prisma } from "../lib/prisma.js";
export class ExpenseService {
    static async createExpense(data) {
        return prisma.expense.create({
            data,
        });
    }
    static async getExpensesByBranch(branchId) {
        return prisma.expense.findMany({
            where: { branchId },
            orderBy: { date: "desc" },
        });
    }
    static async getExpenseById(id) {
        return prisma.expense.findUnique({
            where: { id },
        });
    }
    static async updateExpense(id, data) {
        return prisma.expense.update({
            where: { id },
            data,
        });
    }
    static async deleteExpense(id) {
        return prisma.expense.delete({
            where: { id },
        });
    }
    static async getBranchExpenseStats(branchId) {
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
