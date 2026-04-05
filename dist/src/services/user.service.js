import { prisma } from "../lib/prisma.js";
import { ResourceNotFoundError, UserException } from "../exceptions/AppError.js";
import { hashPassword } from "../utils/security.util.js";
export class UserService {
    static async createUser(data) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser)
            throw new UserException("Email already exists");
        const hashedPassword = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                storeId: true,
                branchId: true,
                branch: { select: { id: true, name: true } },
                createdAt: true,
            }
        });
        // Automatically set as manager of the branch if role is BRANCH_MANAGER
        if (user.role === "BRANCH_MANAGER" && user.branchId) {
            await prisma.branch.update({
                where: { id: user.branchId },
                data: { managerId: user.id },
            });
        }
        return user;
    }
    static async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                store: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
            }
        });
        if (!user)
            throw new ResourceNotFoundError("User", id);
        // Omit password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async getUserProfile(email) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                store: true,
                branch: true,
                managedBranch: true,
            }
        });
        if (!user) {
            throw new ResourceNotFoundError("User", email);
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async updateUser(id, data) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new ResourceNotFoundError("User", id);
        const updatedUser = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                storeId: true,
                branchId: true,
                branch: { select: { id: true, name: true } },
            }
        });
        // Automatically set as manager of the branch if role is BRANCH_MANAGER
        if (updatedUser.role === "BRANCH_MANAGER" && updatedUser.branchId) {
            await prisma.branch.update({
                where: { id: updatedUser.branchId },
                data: { managerId: updatedUser.id },
            });
        }
        return updatedUser;
    }
    static async deleteUser(id) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new ResourceNotFoundError("User", id);
        await prisma.user.delete({ where: { id } });
        return { message: "User deleted successfully" };
    }
    static async listUsers(storeId, branchId, role) {
        return await prisma.user.findMany({
            where: {
                storeId,
                branchId,
                role,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                branch: { select: { id: true, name: true } },
                createdAt: true,
            }
        });
    }
}
