import { prisma } from "../lib/prisma.js";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema.js";
import { ResourceNotFoundError, UserException } from "../exceptions/AppError.js";
import { hashPassword } from "../utils/security.util.js";
import { z } from "zod";
import { buildDbRoleFilter, normalizeRole, normalizeRoleForStorage } from "../utils/role.util.js";

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export class UserService {
  private static normalizeUserRole<T extends { role?: string | null }>(user: T): T {
    return {
      ...user,
      role: normalizeRole(user.role || undefined) || user.role || undefined,
    };
  }

  static async createUser(data: CreateUserInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new UserException("Email already exists");

    const hashedPassword = await hashPassword(data.password);
    const roleForStorage = normalizeRoleForStorage(data.role);

    const user = await prisma.user.create({
      data: {
        ...data,
        role: roleForStorage as any,
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
    if (normalizeRole(user.role) === "BRANCH_MANAGER" && user.branchId) {
      await prisma.branch.update({
        where: { id: user.branchId },
        data: { managerId: user.id },
      });
    }

    return this.normalizeUserRole(user);
  }

  static async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      }
    });
    if (!user) throw new ResourceNotFoundError("User", id);
    
    // Omit password
    const { password, ...userWithoutPassword } = user;
    const normalizedUser = this.normalizeUserRole(userWithoutPassword);
    return normalizedUser;
  }

  static async getUserProfile(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        store: true,
        branch: true,
        managedStore: true,
        managedBranch: {
          include: {
            store: true,
          },
        },
      }
    });

    if (!user) {
      throw new ResourceNotFoundError("User", email);
    }

    const { password, ...userWithoutPassword } = user;

    const effectiveStore = userWithoutPassword.store || userWithoutPassword.managedStore || userWithoutPassword.managedBranch?.store || null;

    const effectiveBranch =
      userWithoutPassword.branch ||
      userWithoutPassword.managedBranch ||
      null;

    const hydratedProfile = {
      ...userWithoutPassword,
      storeId:
        userWithoutPassword.storeId ??
        effectiveStore?.id ??
        userWithoutPassword.managedBranch?.storeId ??
        null,
      branchId: userWithoutPassword.branchId ?? effectiveBranch?.id ?? null,
      store: effectiveStore,
      branch: effectiveBranch,
    };

    return this.normalizeUserRole(hydratedProfile);
  }

  static async updateUser(id: number, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ResourceNotFoundError("User", id);

    const roleForStorage = data.role ? normalizeRoleForStorage(data.role) : undefined;
    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.storeId !== undefined) updateData.storeId = data.storeId;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (roleForStorage !== undefined) updateData.role = roleForStorage;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    if (normalizeRole(updatedUser.role) === "BRANCH_MANAGER" && updatedUser.branchId) {
      await prisma.branch.update({
        where: { id: updatedUser.branchId },
        data: { managerId: updatedUser.id },
      });
    }

    return this.normalizeUserRole(updatedUser);
  }

  static async deleteUser(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ResourceNotFoundError("User", id);

    await prisma.user.delete({ where: { id } });
    return { message: "User deleted successfully" };
  }

  static async listUsers(storeId?: number, branchId?: number, role?: any) {
    const roleFilter = buildDbRoleFilter(role);
    const users = await prisma.user.findMany({
      where: {
        storeId,
        branchId,
        ...(roleFilter ? { role: { in: roleFilter as any[] } } : {}),
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
    return users.map((user) => this.normalizeUserRole(user));
  }
}
