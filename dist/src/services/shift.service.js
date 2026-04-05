import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError, UserException } from "../exceptions/AppError.js";
import { PaymentType } from "../generated/client/index.js";
export class ShiftReportService {
    static async startShift(cashierId, openingBalance) {
        const cashier = await prisma.user.findUnique({
            where: { id: cashierId },
            include: { branch: true }
        });
        if (!cashier || !cashier.branchId) {
            throw new UserException("Cashier must be assigned to a branch to start a shift");
        }
        // Check if there is already an open shift (endTime is null)
        const existingShift = await prisma.shiftReport.findFirst({
            where: { cashierId, endTime: null }
        });
        if (existingShift) {
            console.log(`[Shift] Resuming existing shift for cashier ${cashierId}`);
            return existingShift;
        }
        return await prisma.shiftReport.create({
            data: {
                shiftDate: new Date(),
                startTime: new Date(),
                cashierId,
                branchId: cashier.branchId,
                openingBalance,
                totalSales: 0,
                totalRefunds: 0,
            }
        });
    }
    static async getCurrentShift(cashierId) {
        const shift = await prisma.shiftReport.findFirst({
            where: { cashierId, endTime: null },
            include: { cashier: { select: { id: true, fullName: true } } }
        });
        if (!shift)
            return null;
        const orders = await prisma.order.findMany({
            where: {
                cashierId: shift.cashierId,
                orderDate: { gte: shift.startTime }
            },
            include: {
                orderItems: { include: { product: true } }
            },
            orderBy: { orderDate: 'desc' }
        });
        let totalSales = 0;
        let cashSales = 0;
        let cardSales = 0;
        let upiSales = 0;
        let cashCount = 0;
        let cardCount = 0;
        let upiCount = 0;
        let orderCount = orders.length;
        const productSales = new Map();
        orders.forEach(order => {
            totalSales += order.finalAmount;
            if (order.paymentType === PaymentType.CASH) {
                cashSales += order.finalAmount;
                cashCount++;
            }
            else if (order.paymentType === PaymentType.CARD) {
                cardSales += order.finalAmount;
                cardCount++;
            }
            else if (order.paymentType === PaymentType.UPI) {
                upiSales += order.finalAmount;
                upiCount++;
            }
            order.orderItems.forEach((item) => {
                if (item.product) {
                    const existing = productSales.get(item.productId);
                    if (existing) {
                        existing.quantity += item.quantity;
                    }
                    else {
                        productSales.set(item.productId, {
                            id: item.productId,
                            name: item.product.name,
                            sellingPrice: Number(item.unitPrice),
                            quantity: item.quantity
                        });
                    }
                }
            });
        });
        const refunds = await prisma.refund.findMany({
            where: { shiftReportId: shift.id },
            orderBy: { refundDate: 'desc' }
        });
        const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
        const netSales = totalSales - totalRefunds;
        const paymentSummaries = [
            { type: PaymentType.CASH, totalAmount: cashSales, transactionCount: cashCount },
            { type: PaymentType.CARD, totalAmount: cardSales, transactionCount: cardCount },
            { type: PaymentType.UPI, totalAmount: upiSales, transactionCount: upiCount },
        ].filter(p => p.transactionCount > 0);
        const topSellingProducts = Array.from(productSales.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
        const recentOrders = orders.slice(0, 5).map(o => ({
            id: o.id,
            createdAt: o.orderDate,
            paymentType: o.paymentType,
            totalAmount: o.finalAmount
        }));
        return {
            ...shift,
            totalSales,
            totalRefunds,
            netSales,
            cashSales,
            cardSales,
            upiSales,
            totalOrders: orderCount,
            paymentSummaries,
            topSellingProducts,
            recentOrders,
            refunds: refunds.slice(0, 5)
        };
    }
    static async endShift(shiftId, cashierId) {
        let shift;
        if (shiftId) {
            shift = await prisma.shiftReport.findUnique({
                where: { id: shiftId },
                include: { cashier: true }
            });
        }
        else if (cashierId) {
            shift = await prisma.shiftReport.findFirst({
                where: { cashierId, endTime: null },
                include: { cashier: true }
            });
        }
        if (!shift || shift.endTime) {
            throw new UserException("Open shift not found");
        }
        const currentShiftId = shift.id;
        const today = new Date(shift.shiftDate);
        today.setHours(0, 0, 0, 0);
        // Query all orders created by this cashier on this date
        // Note: In a real scenario, we might want to link orders directly to shifting if possible
        // But per LLD, we query by today + cashier
        const orders = await prisma.order.findMany({
            where: {
                cashierId: shift.cashierId,
                orderDate: { gte: shift.startTime }
            }
        });
        let totalSales = 0;
        let cashSales = 0;
        let cardSales = 0;
        let upiSales = 0;
        let orderCount = orders.length;
        orders.forEach(order => {
            totalSales += order.finalAmount;
            if (order.paymentType === PaymentType.CASH)
                cashSales += order.finalAmount;
            else if (order.paymentType === PaymentType.CARD)
                cardSales += order.finalAmount;
            else if (order.paymentType === PaymentType.UPI)
                upiSales += order.finalAmount;
        });
        // Query refunds for this shift
        const refunds = await prisma.refund.findMany({
            where: { shiftReportId: currentShiftId }
        });
        const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
        const closingBalance = shift.openingBalance + totalSales - totalRefunds;
        return await prisma.shiftReport.update({
            where: { id: currentShiftId },
            data: {
                endTime: new Date(),
                totalSales,
                totalRefunds,
                cashSales,
                cardSales,
                upiSales,
                orderCount,
                closingBalance
            }
        });
    }
    static async getShiftsByBranch(branchId) {
        return await prisma.shiftReport.findMany({
            where: { branchId },
            orderBy: { startTime: 'desc' },
            include: { cashier: true }
        });
    }
    static async getAllShifts() {
        return await prisma.shiftReport.findMany({
            orderBy: { startTime: 'desc' },
            include: { cashier: true, branch: true }
        });
    }
    static async deleteShift(id) {
        return await prisma.shiftReport.delete({ where: { id } });
    }
    static async getShiftReportByDate(cashierId, date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return await prisma.shiftReport.findFirst({
            where: {
                cashierId,
                startTime: { gte: start, lte: end }
            },
            include: { cashier: true }
        });
    }
    static async getShiftById(id) {
        const shift = await prisma.shiftReport.findUnique({
            where: { id },
            include: { cashier: { select: { id: true, fullName: true } }, branch: true }
        });
        if (!shift)
            throw new ResourceNotFoundError("ShiftReport", id);
        return shift;
    }
    static async getCashierShifts(cashierId) {
        return await prisma.shiftReport.findMany({
            where: { cashierId },
            orderBy: { startTime: 'desc' }
        });
    }
}
