import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/security.util.js";
import { AccessDeniedException } from "../exceptions/AppError.js";
import { AppRole, normalizeRole } from "../utils/role.util.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Replicates the OncePerRequestFilter JwtValidator logic
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  // "Bearer TOKEN"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new AccessDeniedException("Authentication token is missing"));
  }

  (async () => {
    const payload = verifyToken(token);
    payload.role = normalizeRole(payload.role || payload.authorities.replace("ROLE_", ""));

    const userId = Number(payload.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return next(new AccessDeniedException("Invalid authentication token"));
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        storeId: true,
        branchId: true,
        managedStore: {
          select: { id: true },
        },
        managedBranch: {
          select: { id: true, storeId: true },
        },
      },
    });

    if (!dbUser) {
      return next(new AccessDeniedException("User account not found"));
    }

    const normalizedRole = normalizeRole(dbUser.role) || payload.role;
    payload.email = dbUser.email;
    payload.userId = dbUser.id;
    payload.role = normalizedRole;
    payload.authorities = `ROLE_${normalizedRole || "STORE_ADMIN"}`;
    payload.storeId =
      dbUser.storeId ?? dbUser.managedStore?.id ?? dbUser.managedBranch?.storeId ?? undefined;
    payload.branchId = dbUser.branchId ?? dbUser.managedBranch?.id ?? undefined;

    req.user = payload;
    next();
  })().catch((error: any) => {
    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError" ||
      error?.name === "NotBeforeError"
    ) {
      return next(new AccessDeniedException("Invalid or expired token"));
    }

    return next(error);
  });
};

// Replicates the PreAuthorize or HTTP security filter
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AccessDeniedException("User not authenticated"));
    }

    const userRole = normalizeRole(req.user.role || req.user.authorities.replace("ROLE_", ""));
    const normalizedAllowedRoles = roles
      .map((role) => normalizeRole(role))
      .filter((role): role is AppRole => Boolean(role));

    if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
      return next(
        new AccessDeniedException("You do not have permission to access this resource")
      );
    }
    
    next();
  };
};
